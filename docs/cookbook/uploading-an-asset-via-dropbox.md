# Uploading an Asset via Dropbox

## Step 1 &mdash; First Steps

Go to the [Zapier Zaps page](https://zapier.com/app/assets/zaps) and click **Create**.
Click **New Zap** from the dropdown menu. You will be redirected to the Zap editor.

## Step 2 &mdash; Select The Trigger Event

Click the **Trigger** button. In the modal that appears, search for and select **Dropbox**.

During setup, you'll need to configure:
* **Trigger Event**: Select **New File in Folder**
* **Account**: Click **Sign In** and authenticate with your Dropbox account. When prompted, allow Zapier to access your Dropbox files.
* Click **Continue**

![Dropbox trigger setup](/docs/cookbook/images/zapier-dropbox-01-trigger-setup.png)

For configuration:
* Select the **Space** and **Folder** you want to monitor.
* Select **False** for **Include files in subfolders?**
* Keep **Include file contents?** set to **Yes**
* Keep **Include sharing link?** set to **Yes**
* Click **Continue**
* Click **Test Trigger** (or **Skip Test** to proceed without testing)

![Dropbox trigger configuration](/docs/cookbook/images/zapier-dropbox-02-trigger-configure.png)

## Step 3 &mdash; Select The Action Event

* Click the **Action** button
* Search for and select **Screenly (x.y.z)**
* For **Action Event**, select **Upload Asset**

For **Account**:
* Click **Sign In**
* In the new window, enter your Screenly API key
* Click **Yes, Continue to Screenly (x.y.z)**
* Click **Continue**

![Screenly action setup](/docs/cookbook/images/zapier-dropbox-03-action-setup.png)

Configure the action:
* For **File URL**: Click **+** and select **Link**
* For **Title**: Click **+** and select **File Name**
* Click **Continue**
* Click **Test Step** (or **Skip Test** to proceed without testing)

![Screenly action configuration](/docs/cookbook/images/zapier-dropbox-04-action-configure.png)

## Step 4 &mdash; Save and Publish

Click **Publish**. Once redirected to the confirmation page, ensure the Zap is enabled
using the toggle switch.

## Step 5 &mdash; Test Your Zap

* Upload a file to your selected Dropbox folder
* Wait a few minutes for processing
* Visit [screenly.io](https://www.screenly.io/) and sign in
* Click **Content** in the menu bar
* Verify that your new asset appears

You can monitor the Zap's execution in the [Zap history](https://zapier.com/app/history).

![Screenly action configuration](/docs/cookbook/images/zapier-dropbox-05-zap-runs.png)
