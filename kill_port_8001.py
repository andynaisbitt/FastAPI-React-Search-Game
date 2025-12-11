"""
Kill all processes listening on port 8001
"""
import subprocess
import re

# Get all processes on port 8001
result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
lines = result.stdout.split('\n')

pids = set()
for line in lines:
    if ':8001' in line and 'LISTENING' in line:
        # Extract PID (last column)
        parts = line.split()
        if parts:
            try:
                pid = int(parts[-1])
                pids.add(pid)
            except:
                pass

print(f"Found {len(pids)} processes on port 8001: {pids}")

for pid in pids:
    try:
        subprocess.run(['taskkill', '/PID', str(pid), '/F'], capture_output=True)
        print(f"Killed PID {pid}")
    except Exception as e:
        print(f"Failed to kill PID {pid}: {e}")

print("Done!")
