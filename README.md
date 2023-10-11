# Table of Contents

- [Table of Contents](#table-of-contents)
- [Simple Directory Observer v0.1.0](#simple-directory-observer-v010)
- [Setup and Running](#setup-and-running)
  - [System Requirements](#system-requirements)
  - [Building and Running the Container](#building-and-running-the-container)
- [Troubleshooting](#troubleshooting)
  - [Troubleshooting: Container Runtime](#troubleshooting-container-runtime)
- [Logging](#logging)

---

# Simple Directory Observer v0.1.0

Observe directory path(s) and when the count of files reaches a certain number, email a certain email address.

**Features**:

- Can watch multiple directories concurrently with their own individual threshold limits.
- Logs data to a local directory.
- Sends email when a threshold is breached for any of the watched directories.

---

# Setup and Running

## System Requirements

- Docker needs to be installed for your Operating System.

## Building and Running the Container

Before building the image, we need to pull the repo and add the environment variables to a `.env` file in the root directory of the repo. After that we can build the image and run the container.

**Pulling the Repository to Local**:

```sh
# -----------
# Pull repo
# -----------
git clone https://github.com/jayantasamaddar/simple-directory-observer.git
cd simple-directory-observer
```

**Setting Environment Variables**:

In `.env`

```sh
# -------------------------
# Set environment variables
# -------------------------
# Mandatory
EMAIL_USER=jayanta@zenius.one       # Email of the user on behalf of which the email client will send the email
EMAIL_PASSWORD=xxxxxxxxxxxxxx       # Password of the above user
EMAIL_HOST="smtppro.zoho.in"        # SMTP config settings. E.g. https://www.zoho.com/mail/help/zoho-smtp.html
EMAIL_PORT=465                      # SMTP config settings. E.g. https://www.zoho.com/mail/help/zoho-smtp.html
EMAIL_SENDER="Jayanta Samaddar"     # Sender name that will show up on the email clients
EMAIL_RECEIVER="Team Jayanta"       # Receiver name that will show up on the email clients
EMAIL_FROM="hello@zenius.one"       # From address
EMAIL_TO="jayanta@zenius.one"       # To Address
DIRPATH_OPTIONS="/Users/jayanta/test=5,/Users/jayanta/test2=6"  # Directory config in the format DIRPATH_OPTIONS=[PATH]=[THRESHOLD],[PATH2]=[THRESHOLD2]


# Optional. The following are default values.
APP_NAME="Simple Directory Observer"    # Name of the app, will show as Via $APP_NAME in the Email clients
SNOOZE=60                               # Once threshold is exceeded an email is sent. Threshold specifies the minutes after which another email will be sent.
LOCALE=en-US                            # ISO 639 Locale format
TZ=Asia/Kolkata                         # IANA TimeZone identifier
LOGS_PATH=/tmp/simple-directory-observer    # Path to logs
RECURSIVE=true                              # Can specify false to turn off recursive observation of directories. Defaults to true.
```

**Building the Container Image**:

```sh
# ----------------------------
# Build Image
# ----------------------------
git clone https://github.com/jayantasamaddar/simple-directory-observer.git
cd simple-directory-observer


# Build Image
docker build -t simple-directory-observer .
```

**Running the Docker Container**:

The `DIRPATH_OPTIONS` are ideally passed at Container Runtime and not Build time as they allow the flexibility to modify it for individual projects. Setting the environment variables with `-e` will overwrite the `DIRPATH_OPTIONS` declared on the `.env` file that may have been used during build.

You can also do the same for other environment variables. However the `EMAIL_PASSWORD` is best not used on the command line using this method for security reasons. Use the `.env.example` as reference.

By default, you should run the container in detached mode:

```sh
# ---------------------------------------
# Running the Container in Detached Mode
# ---------------------------------------
## (1) You have to mount each of the directory paths to the same path on the container.
## (2) Set an environment variable called DIRPATH, in the format DIRPATH_OPTIONS=[PATH]=[THRESHOLD],[PATH2]=[THRESHOLD2]. This sets the threshold for each directory. A threshold is breached when the number of files surpass the threshold. Some action is taken then.
## (3) If you want to have access to logs on the local machine, allow `rw` permission to a log directory. E.g.: `/tmp`

docker run --name simple-directory-observer -d \
    -v /tmp:/tmp:rw \
    -v /Users/jayanta/test:/Users/jayanta/test \
    -v /Users/jayanta/test2:/Users/jayanta/test2 \
    -e DIRPATH_OPTIONS=/Users/jayanta/test=5,/Users/jayanta/test2=6 \
    simple-directory-observer
```

**Running in Interactive Mode**: Can be used to check the Live logs as the files are added to the watched directories.

```sh
docker run --name simple-directory-observer -it \
    -v /tmp:/tmp:rw \
    -v /Users/jayanta/test:/Users/jayanta/test \
    -v /Users/jayanta/test2:/Users/jayanta/test2 \
    -e DIRPATH_OPTIONS=/Users/jayanta/test=5,/Users/jayanta/test2=6 \
    simple-directory-observer
```

---

# Troubleshooting

## Troubleshooting: Container Runtime

Here are the following ways you can troubleshoot in different situations:

```sh
# Enter the terminal of the detached running container
docker exec -it simple-directory-observer /bin/sh

# Enter Troubleshooting mode by starting new init container
docker run --name simple-directory-observer-troubleshooting -e DIRPATH_OPTIONS=/Users/jayanta/test=5,/Users/jayanta/test2=6 \
    -it --init --rm simple-directory-observer /bin/sh

# Enter Troubleshooting mode by starting new init container with Logging
docker run --name simple-directory-observer-troubleshooting \
    -e DIRPATH_OPTIONS=/Users/jayanta/test=5,/Users/jayanta/test2=6 \
    -v /tmp/simple-directory-observer:/tmp/simple-directory-observer:rw \
    -it --init --rm simple-directory-observer /bin/sh
```

---

# Logging

Logs are stored only for success and failure messages on submission to a `logs.json` file inside a directory path specified by the `LOGS_PATH` environment variable.

By default the logs are appended to: `/tmp/simple-directory-observer/logs.json`, where `LOGS_PATH=/tmp/simple-directory-observer`. This is available on the container, however you map the container volume path to the local node volume, the container logs can be written directly to the local machine. The setup is demonstrated above.

Other environment variables that when modified affects how logging is done:

- `LOCALE`: ISO 639 format. (Default: `en-US`)
- `TZ`: IANA TimeZone identifier. (Default: `Asia/Kolkata`)

**Format**:

```sh
INFO:   10/12/2023, 02:58:24 GMT+5:30   Number of files in "/Users/jayanta/test" updated: 5
INFO:   10/12/2023, 02:58:24 GMT+5:30   Reached file count, 5. Sending Email...
INFO:   10/12/2023, 02:58:25 GMT+5:30   Message sent: <4bc5ec08-f894-1901-c3af-08c6dfd85e3f@zenius.one>
ERROR:  10/12/2023, 02:58:25 GMT+5:30   ECONNREFUSED
```

---
