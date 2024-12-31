# Screenly Zapier Integration

<p align="center">
  <img src="assets/logo-full.svg" alt="Screenly for Zapier" width="400">
</p>

[![Test](https://github.com/screenly/zapier/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/screenly/zapier/actions/workflows/test.yml)

A Zapier integration for automating Screenly digital signage operations. Connect your
Screenly displays with 5000+ apps.

## :rocket: Quick Start

### Step 1 &mdash; Install the Integration

> [!NOTE]
> There is no public version of this integration yet. In the meantime, you can
> install it privately by following the steps below.

  - Run the following command to set up and install the integration privately:

    ```bash
    zapier login
    zapier register "Screenly"
    ```

  - Push the changes to Zapier:

    ```bash
    zapier push
    ```

### Step 2 &mdash; Create Your First Zap

  - Go to [Zapier](https://zapier.com).
  - Go to the sidebar and click "Create".
  - Choose your trigger app (e.g., Dropbox, SharePoint, Google Drive).
    We will use Dropbox as an example.
  - Select a "Trigger event" from the list of available events. For example,
    select "New File in Folder". Configure what directory you want to monitor.
  - Choose Screenly as your action app.
  - Select the action event that you want to be executed. For example,
    select "Upload Asset". Click "Continue".
  - Configure the "Action Event". For example, select the folder you want to monitor.
  - For the "Account", link your Screenly account.
    It should open a new window that asks for your Screenly API token. Once
    you confirm, it should be linked to your Zap.
  - Click "Continue".
  - For "File URL", select "Direct Media Link".
  - For "Title", select "File Name".
  - Click "Continue". Feel free to "Skip test".
  - Click "Publish".
  - Make sure that the Zap is enabled.
  - Upload your file to the folder you configured.
  - Go to your Screenly dashboard and click "Content" from the sidebar.
  - You should see the new asset that was uploaded.

## :zap: Quick Links

- [Available Actions](docs/available-actions.md)
- [Developer Documentation](docs/developer-documentation.md)
- [Common Use Cases](docs/common-use-cases.md)
- [Example Integrations](docs/example-integrations.md)

## :lock: Security

- API keys are stored securely by Zapier
- All API requests are made over HTTPS
- The integration follows Zapier's security best practices