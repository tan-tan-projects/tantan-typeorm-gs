export function validateWorksheetName(sheetName: string): void
{
    if (sheetName.length === 0) throw new Error('Worksheet name cannot be empty.');
    if (sheetName.length > 100) throw new Error('Worksheet name cannot exceed 100 characters.');
    if (/[:\\/?*\[\]]/.test(sheetName)) throw new Error('Worksheet name contains invalid characters.');
}

export function buildWorksheetRange(sheetName: string, range: string): string
{
    const escapedSheetName = `'${sheetName.replace(/'/g, "''")}'`;

    return `${escapedSheetName}!${range}`;
}