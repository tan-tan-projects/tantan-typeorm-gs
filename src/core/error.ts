export class GoogleSheetsDriverError extends Error
{
    constructor(
        message: string,
        options?: ErrorOptions,
    )
    {
        super(message, options);

        this.name = 'GoogleSheetsDriverError';
    }
}

export class GoogleSheetsAuthenticationError extends GoogleSheetsDriverError
{
    constructor(
        message = 'Google Sheets authentication failed.',
        options?: ErrorOptions,
    )
    {
        super(message, options);

        this.name = 'GoogleSheetsAuthenticationError';
    }
}

export class GoogleSheetsSpreadsheetNotFoundError extends GoogleSheetsDriverError
{
    constructor(
        message = 'Google Sheets spreadsheet not found.',
        options?: ErrorOptions,
    )
    {
        super(message, options);

        this.name = 'GoogleSheetsSpreadsheetNotFoundError';
    }
}

export class GoogleSheetsWorksheetNotFoundError extends GoogleSheetsDriverError
{
    constructor(
        message: string,
        options?: ErrorOptions,
    )
    {
        super(message, options);

        this.name = 'GoogleSheetsWorksheetNotFoundError';
    }
}

export class GoogleSheetsParseError extends GoogleSheetsDriverError
{
    constructor(
        message: string,
        options?: ErrorOptions,
    )
    {
        super(message, options);

        this.name = 'GoogleSheetsParseError';
    }
}

export class GoogleSheetsInvalidRangeError extends GoogleSheetsDriverError
{
    constructor(
        message = 'Google Sheets range is invalid.',
        options?: ErrorOptions,
    )
    {
        super(message, options);

        this.name = 'GoogleSheetsInvalidRangeError';
    }
}

export class GoogleSheetsInvalidMetadataError extends GoogleSheetsDriverError
{
    constructor(
        message = 'Google Sheets metadata is invalid.',
        options?: ErrorOptions,
    )
    {
        super(message, options);

        this.name = 'GoogleSheetsInvalidMetadataError';
    }
}

export class GoogleSheetsDuplicatePrimaryKeyError extends GoogleSheetsDriverError
{
    constructor(
        message = 'Duplicate primary key.',
        options?: ErrorOptions,
    )
    {
        super(message, options);

        this.name = 'GoogleSheetsDuplicatePrimaryKeyError';
    }
}

export class GoogleSheetsMissingPrimaryKeyError extends GoogleSheetsDriverError
{
    constructor(
        message = 'Missing primary key.',
        options?: ErrorOptions,
    )
    {
        super(message, options);
        this.name = 'GoogleSheetsMissingPrimaryKeyError';
    }
}

export class GoogleSheetsUnsupportedOperationError extends GoogleSheetsDriverError
{
    constructor(
        operation: string,
        options?: ErrorOptions,
    )
    {
        super(
            `Google Sheets operation "${operation}" is not supported.`,
            options,
        );

        this.name = 'GoogleSheetsUnsupportedOperationError';
    }
}

export class GoogleSheetsGenaralError extends GoogleSheetsDriverError
{
    constructor(
        message: string,
        options?: ErrorOptions,
    )
    {
        super(message, options);

        this.name = 'GoogleSheetsGenaralError';
    }
}