#!/bin/bash
# Deployment Testing Script for Visitor Management System
# This script tests various components of the deployed application

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Configuration
HOST_URL=${1:-"http://localhost:4000"}
ADMIN_EMAIL=${2:-"admin@example.com"}
ADMIN_PASSWORD=${3:-"Admin@123"}

echo -e "${YELLOW}Testing VMS Deployment at $HOST_URL${NC}"
echo "=============================================="

# Function to run tests
run_test() {
  TEST_NAME=$1
  TEST_CMD=$2
  
  echo -ne "Testing $TEST_NAME... "
  
  if eval $TEST_CMD > /dev/null 2>&1; then
    echo -e "${GREEN}PASSED${NC}"
    return 0
  else
    echo -e "${RED}FAILED${NC}"
    return 1
  fi
}

# Health Check Test
run_test "Health Endpoint" "curl -s $HOST_URL/api/health | grep -q 'status.*ok'"

# MongoDB Connection Test
run_test "MongoDB Connection" "curl -s $HOST_URL/api/health | grep -q 'status.*ok'"

# API Authentication Test
get_auth_token() {
  # Get CSRF token
  CSRF_TOKEN=$(curl -s -c cookie.txt $HOST_URL/api/auth/csrf | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)
  
  # Log in and get session
  curl -s -b cookie.txt -c cookie.txt -H "Content-Type: application/json" \
    -d "{\"csrfToken\":\"$CSRF_TOKEN\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"callbackUrl\":\"$HOST_URL/dashboard\"}" \
    "$HOST_URL/api/auth/callback/credentials" > /dev/null
  
  # Get session data
  SESSION_DATA=$(curl -s -b cookie.txt "$HOST_URL/api/auth/session")
  
  # Check if user is authenticated
  echo $SESSION_DATA | grep -q "\"user\""
  return $?
}

run_test "Authentication" "get_auth_token"

# Test API Endpoints
if [ -f cookie.txt ]; then
  run_test "Dashboard API" "curl -s -b cookie.txt $HOST_URL/api/dashboard/summary | grep -q 'totalVisits'"
  run_test "Departments API" "curl -s -b cookie.txt $HOST_URL/api/admin/departments | grep -q '\[\{\"_id\"'"
  run_test "Hosts API" "curl -s -b cookie.txt $HOST_URL/api/admin/hosts | grep -q '\[\{\"_id\"'"
  run_test "Visitors API" "curl -s -b cookie.txt $HOST_URL/api/visitors | grep -q '\[\{\"_id\"'"
  
  # Cleanup
  rm -f cookie.txt
fi

# Test Static Assets
run_test "Static Assets" "curl -s -I $HOST_URL/_next/static/ | grep -q '200 OK'"

# Check Nginx SSL Configuration (if HTTPS)
if [[ "$HOST_URL" == https* ]]; then
  run_test "SSL Configuration" "curl -s -I $HOST_URL | grep -q 'Strict-Transport-Security'"
fi

echo -e "\n${YELLOW}Deployment Test Summary${NC}"
echo "========================="
echo -e "Environment: ${GREEN}$(curl -s $HOST_URL/api/health | grep -o '\"environment\":\"[^\"]*' | cut -d'"' -f4)${NC}"
echo -e "Version: ${GREEN}$(curl -s $HOST_URL/api/health | grep -o '\"version\":\"[^\"]*' | cut -d'"' -f4)${NC}"
echo -e "Uptime: ${GREEN}$(curl -s $HOST_URL/api/health | grep -o '\"uptime\":\"[^\"]*' | cut -d'"' -f4)${NC}"

echo -e "\n${GREEN}Deployment testing completed!${NC}"