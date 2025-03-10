# Download the binary for your system
sudo curl -L --output /usr/local/bin/gitlab-runner ${GITLAB_CI_RUNNER_DOWNLOAD_LOCATION}

# Give it permission to execute
sudo chmod +x /usr/local/bin/gitlab-runner

# Create a GitLab Runner user
sudo useradd --comment 'GitLab Runner' --create-home gitlab-runner --shell /bin/bash

# Install and run as a service
sudo gitlab-runner install --user=gitlab-runner --working-directory=/home/gitlab-runner
sudo gitlab-runner start

# If using a `deb` package based distribution
curl -s https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
apt install -y gitlab-runner

# If using an `rpm` package based distribution
curl -s https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.rpm.sh | sudo bash
dnf install -y gitlab-runner
