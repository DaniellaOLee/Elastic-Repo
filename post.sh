#!/bin/sh
read -p "Are you sure you would like to upload the file?(Yy/Nn) " -n 1 -r
echo    # 
if [[ $REPLY =~ ^[Yy]$ ]]
then
if [$2 = '']
then
aws s3 cp "$1" "s3://elastic-repo-qac/$1"
echo "Uploaded to root"
 else
aws s3 cp "$1" "s3://elastic-repo-qac/$2/$1"
echo "Uploaded to your chosen folder"
fi

else 
echo "Upload cancelled"
fi
