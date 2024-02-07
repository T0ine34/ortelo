import sys, subprocess

def _is_true(v):
    return v.lower() in ("yes", "true", "t", "1", "y")

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    
def ask_install(package, confirm=True):
    print("Package {} is not installed. Do you want to install it?".format(package))
    answer = input("y/n: ") if confirm else "yes"
    if _is_true(answer):
        install(package)
        return True
    else:
        return False


def ask_install_all(packages, confirm=True):
    if packages:
        print("The following packages are not installed: {}".format(", ".join(packages)))
        print("Do you want to install them?")
        answer = input("y/n: ") if confirm else "yes"
        if _is_true(answer):
            for package in packages:
                install(package)
        else:
            return False
    else:
        print("All packages are already installed.")
    return True

if __name__ == "__main__":
    ask_install(sys.argv[1], confirm=False)