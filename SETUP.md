# Setup Guide

This guide will help you set up and run the Focus Planning application.

## Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Comes with Node.js
- **Microsoft SQL Server**: Local or remote instance
- **Azure DevOps Account**: With Personal Access Token

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Create Database

Connect to your SQL Server and run:

```sql
CREATE DATABASE focus_planning;
```

#### Apply Schema

Execute the schema script located at `database/schema.sql`:

**Using sqlcmd:**
```bash
sqlcmd -S localhost -U sa -P YourPassword -d focus_planning -i database/schema.sql
```

**Using SQL Server Management Studio:**
1. Open SSMS
2. Connect to your SQL Server instance
3. Open `database/schema.sql`
4. Execute the script

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DB_SERVER=localhost
DB_NAME=focus_planning
DB_USER=sa
DB_PASSWORD=YourActualPassword123!
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# Azure DevOps Configuration
AZDO_ORG_URL=https://dev.azure.com/yourorganization
AZDO_TOKEN=your-personal-access-token-here

# Next.js
NEXT_PUBLIC_APP_NAME=Focus Planning
```

#### Getting Azure DevOps Personal Access Token

1. Go to Azure DevOps (https://dev.azure.com)
2. Click on your profile icon → Personal Access Tokens
3. Click "New Token"
4. Set the following scopes:
   - **Work Items**: Read
   - **Project and Team**: Read
5. Copy the generated token to your `.env` file

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
npm run start
```

## Database Schema Overview

The application uses 6 main tables:

- **Teams**: Store team information
- **TeamMembers**: Individual team members with capacity settings
- **FocusPeriods**: Planning timeframes
- **WorkItems**: Synced work items from Azure DevOps
- **CapacityAllocations**: Member assignments to work items
- **MemberAvailability**: Availability overrides (vacation, holidays)

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify SQL Server is running
2. Check firewall settings allow connections on port 1433
3. Ensure SQL Server authentication is enabled
4. Test connection with sqlcmd:
   ```bash
   sqlcmd -S localhost -U sa -P YourPassword
   ```

### Azure DevOps Sync Issues

If work item sync fails:

1. Verify your Personal Access Token is valid
2. Ensure the token has correct scopes (Work Items: Read, Project and Team: Read)
3. Check the organization URL is correct
4. Verify you have access to the project in Azure DevOps

### Build Errors

If you encounter build errors:

1. Clear Next.js cache:
   ```bash
   rm -rf .next
   ```
2. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Rebuild:
   ```bash
   npm run build
   ```

## Next Steps

1. **Create Teams**: Navigate to `/teams` and create your first team
2. **Add Members**: Add team members with their capacity settings
3. **Create Focus Periods**: Define your planning timeframes
4. **Sync Work Items**: Connect to Azure DevOps and sync work items
5. **Allocate Capacity**: Assign team members to work items

## Support

For issues or questions:
- Check the main README.md for detailed documentation
- Review API documentation in the README
- Open an issue in the GitHub repository
