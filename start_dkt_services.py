import os
import sys
import subprocess
import time
import requests
import venv
from pathlib import Path

def setup_environment_and_dependencies():
    """Creates a virtual environment if needed and installs dependencies."""
    venv_dir = Path("dkt_env")
    requirements_file = Path("dkt") / "requirements.txt"

    if not venv_dir.exists():
        print(f"Creating virtual environment at {venv_dir}...")
        venv.create(venv_dir, with_pip=True)

    # Determine the correct pip executable based on the operating system
    if sys.platform == "win32":
        pip_executable = venv_dir / "Scripts" / "pip.exe"
    else:
        pip_executable = venv_dir / "bin" / "pip"
    
    print(f"Installing dependencies from {requirements_file}...")
    # Use -q for a quieter installation
    subprocess.run([str(pip_executable), "install", "-r", str(requirements_file), "-q"], check=True)
    print("✓ Dependencies are up to date.")
    return True

def start_dkt_service():
    """Starts the DKT Flask service as a subprocess."""
    if not setup_environment_and_dependencies():
        return False
    
    print("\nStarting DKT service...")
    
    # Determine the correct python executable from the virtual environment
    if sys.platform == "win32":
        python_executable = Path("dkt_env") / "Scripts" / "python.exe"
    else:
        python_executable = Path("dkt_env") / "bin" / "python"

    # Set environment variable for Flask
    env = os.environ.copy()
    env['FLASK_APP'] = 'api.py'
    
    try:
        # Use cwd to run the command from 'inside' the dkt directory.
        # This makes imports like 'from model import ...' work correctly.
        # Use Popen for non-blocking execution to see logs in real-time.
        process = subprocess.Popen(
            [str(python_executable), "-m", "flask", "run", "--port=5002"],
            cwd="dkt",
            env=env
        )
        process.wait() # Wait for the process to exit
    except KeyboardInterrupt:
        print("\nStopping DKT service...")
        process.terminate()
    except Exception as e:
        print(f"\nError starting DKT service: {e}")
        return False
    
    return True

def check_service_health():
    """Pings the service to check if it's running and responsive."""
    print("Checking DKT service health...")
    try:
        response = requests.get('http://localhost:5002/dkt/status', timeout=5)
        if response.status_code == 200:
            print("✓ DKT service is running and responsive.")
            print(f" -> Status: {response.json()}")
            return True
    except requests.ConnectionError:
        pass
    
    print("✗ DKT service is not responding. Please ensure it is running.")
    return False

if __name__ == "__main__":
    # Ensure the 'dkt' directory exists before doing anything
    if not Path("dkt").is_dir():
        print("Error: 'dkt' directory not found. Please run this script from the project root (e.g., 'capstone/').")
        sys.exit(1)

    if len(sys.argv) > 1 and sys.argv[1] == "check":
        check_service_health()
    else:
        start_dkt_service()

