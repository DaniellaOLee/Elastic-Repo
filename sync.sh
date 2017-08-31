#!/bin/sh

# Echo the current date and time

echo '-----------------------------'
date
echo '-----------------------------'
echo ''

#Echo script initialization
echo 'Syncing remote S3 bucket...'

BACKUPLOCATION=/home/ec2-user/s3/elastic-repo-qac/

#Run the sync command
/bin/rm -rf /home/ec2-user/s3/elastic-repo-qac/backup-4/*
/bin/mv $BACKUPLOCATION/backup-3/* $BACKUPLOCATION/backup-4/
/bin/mv $BACKUPLOCATION/backup-2/* $BACKUPLOCATION/backup-3/
/bin/mv $BACKUPLOCATION/backup-1/* $BACKUPLOCATION/backup-2/
/bin/mv $BACKUPLOCATION/backup-0/* $BACKUPLOCATION/backup-1/
/usr/bin/aws s3 sync s3://elastic-repo-qac $BACKUPLOCATION/backup-0/


#Echo script completion
echo 'Sync complete'
