#!/bin/sh
echo "=== create-dagster scaffold ==="
d=$(mktemp -d) && cd "$d" || exit 1
uvx -q create-dagster@latest project pa-probe --uv-sync 2>&1 | tail -6
echo "--- files ---"
ls pa-probe
echo "=== dagster dev boot ==="
cd pa-probe || exit 1
(uv run dagster dev -p 13334 > "$d/devlog.txt" 2>&1 &
 DEVPID=$!
 n=0
 while [ $n -lt 45 ] && ! grep -q "Serving dagster-webserver" "$d/devlog.txt"; do sleep 2; n=$((n+1)); done
 grep -E "Launching Dagster services|Serving dagster-webserver" "$d/devlog.txt" | head -3
 curl -s --max-time 5 http://127.0.0.1:13334/server_info | head -c 200
 echo
 kill $DEVPID 2>/dev/null
 pkill -f "dagster dev -p 13334" 2>/dev/null
 pkill -f "dagster-webserver" 2>/dev/null
 pkill -f "dagster-daemon" 2>/dev/null
)
cd / && rm -rf "$d"
echo "done"
