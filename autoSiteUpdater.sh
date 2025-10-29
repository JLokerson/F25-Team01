#!/bin/bash

# Defined Cronjob (view with sudo crontab -l and vi /var/log/siteUpdater.log)
# 0 0,12 * * * /usr/local/bin/autoSiteUpdater.sh > /var/log/siteUpdater.log 2>&1
# To run this file use the following command on the ec2 server
# sudo /usr/local/bin/autoSiteUpdater.sh

# Defined application directory
APP_DIR="/home/ubuntu/repo/F25-Team01/client"

# Change to the application directory
cd "$APP_DIR" || { echo "Failed to change directory to $APP_DIR" >&2; exit 1; }

# Run the update commands

echo "Starting client update at $(date)"

# 1. Pull latest code
sudo git pull

# 2. Build the application
sudo npm run build

# Check if the build directory exists before copying
if [ -d "build" ]; then
    # 3. Copy new build to web server root
    sudo cp -R build/ /var/www/html/my-react-app/

    # 4. Test and reload Nginx
    sudo nginx -t && sudo systemctl reload nginx
else
    echo "Build failed: 'build' directory not found." >&2
    exit 1
fi

echo "Deployment finished at $(date)"
exit 0