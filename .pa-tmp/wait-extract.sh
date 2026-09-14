#!/bin/sh
until [ "$(ls data/fraud-prevention/evidence/*.json 2>/dev/null | wc -l | tr -d ' ')" -ge 5 ] && [ "$(ls data/billing-subscriptions/evidence/*.json 2>/dev/null | wc -l | tr -d ' ')" -ge 6 ]; do sleep 10; done
echo EXTRACT_ALL_DONE
