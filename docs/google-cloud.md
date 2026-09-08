## Google Cloud Setup

`tantan-typeorm-gs` uses the Google Sheets API to read and modify spreadsheet data.

The recommended setup for this driver is a **Google Cloud service account** with access to the target Google Spreadsheet.

### 1. Create a Google Cloud Project

Create or select a project in Google Cloud Console.

The project will be used to manage the Google Sheets API and the service account used by the application.

### 2. Enable Google Sheets API

Open the **API Library** in Google Cloud Console and enable:

```text
Google Sheets API
```

The API service name is:

```text
sheets.googleapis.com
```

Google Cloud requires the corresponding API to be enabled before an application can use it.

### 3. Create a Service Account

Open:

```text
IAM & Admin → Service Accounts
```

Create a new service account for the application.

For example:

```text
tantan-typeorm-gs
```

A service account represents the application rather than an individual Google user and can be granted access to Google Cloud resources.

After creating the service account, note its email address:

```text
tantan-typeorm-gs@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 4. Create Service Account Credentials

For local development, create a service account key in JSON format from the service account's **Keys** section.

The generated credential contains sensitive information, including the private key.

**Do not commit the JSON key to Git.**

Google notes that user-managed service account keys are long-lived credentials and should be handled carefully. For workloads running on Google Cloud or supported external environments, more secure alternatives such as attached service accounts or Workload Identity Federation should be considered.

### 5. Share the Spreadsheet

Open the Google Spreadsheet that will be used by the application.

Share the spreadsheet with the service account email:

```text
tantan-typeorm-gs@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Grant the service account the required access level.

For this driver, the service account must be able to access the spreadsheet and perform the operations required by the application. Google also documents sharing the spreadsheet directly with the service account as part of Sheets API service-account setup.

### 6. Get the Spreadsheet ID

The spreadsheet ID is part of the Google Sheets URL:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

For example:

```text
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit
```

The spreadsheet ID is:

```text
1AbCdEfGhIjKlMnOpQrStUvWxYz
```

This value is passed to the driver's configuration.

### Next Step

After Google Cloud and spreadsheet access have been configured, configure the driver's authentication credentials in the application.
