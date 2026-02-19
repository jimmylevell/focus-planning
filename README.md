# Focus Planning

A Next.js web application for managing team capacity planning with Azure DevOps integration. This application provides a streamlined interface for planning team resources, tracking work items, and visualizing capacity utilization.

![Focus Planning Dashboard](https://github.com/user-attachments/assets/47f779b1-6ca6-4f29-8a83-5d2ec1b85d78)

## Features

### Core Capabilities

- **Single Source of Truth**: Direct integration with Azure DevOps eliminates manual duplication
- **Real-Time Planning Transparency**: Up-to-date visibility of team capacity, focus load, and delivery risks
- **Planning Efficiency**: Automated calculations for capacity, utilization, and variance
- **Data Consistency & Governance**: Standardized planning structures and validation
- **Scalability & UX**: Support for multiple teams and focuses with intuitive UI

### Key Functionality

1. **Team & Member Configuration**
   - Create, edit, and archive teams
   - Manage team members with capacity settings
   - Define availability overrides for vacations and holidays

2. **Focus Period Management**
   - Create planning timeframes aligned with Azure DevOps iterations
   - Define capacity models (80%, 100%, custom)
   - Link to DevOps iterations, tags, or custom fields

3. **Azure DevOps Synchronization**
   - Sync work items (Ergebnis) from Azure DevOps
   - Filter by focus, area path, iteration, state, and tags
   - Scheduled and manual refresh options

4. **Capacity Allocation**
   - Assign team members to work items
   - Define allocation in days or percentage
   - Inline editing and drag & drop support
   - Validation warnings for over-allocation

5. **Capacity Overview Dashboard**
   - Team member capacity views (planned vs available)
   - Focus load analysis
   - Utilization heatmaps
   - Variance reporting

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript and React
- **Styling**: Tailwind CSS for responsive UI
- **Database**: Microsoft SQL Server (MSSQL)
- **Integration**: Azure DevOps REST API
- **Validation**: Zod for schema validation

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Microsoft SQL Server (local or remote)
- Azure DevOps account with Personal Access Token

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jimmylevell/focus-planning.git
   cd focus-planning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - Database connection settings
   - Azure DevOps organization URL and token

4. **Set up the database**
   
   Run the SQL schema script against your database:
   ```bash
   sqlcmd -S localhost -U sa -P YourPassword -i database/schema.sql
   ```
   
   Or use SQL Server Management Studio to execute `database/schema.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_SERVER=localhost
DB_NAME=focus_planning
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# Azure DevOps Configuration
AZDO_ORG_URL=https://dev.azure.com/yourorg
AZDO_TOKEN=your-personal-access-token

# Next.js
NEXT_PUBLIC_APP_NAME=Focus Planning
```

### Azure DevOps Personal Access Token

1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Create a new token with the following scopes:
   - Work Items: Read
   - Project and Team: Read

## Database Schema

The application uses the following main tables:

- **Teams**: Team information and metadata
- **TeamMembers**: Individual team members with capacity settings
- **FocusPeriods**: Planning timeframes and capacity models
- **WorkItems**: Synchronized work items from Azure DevOps
- **CapacityAllocations**: Member assignments to work items
- **MemberAvailability**: Availability overrides for members

See `database/schema.sql` for the complete schema definition.

## API Endpoints

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/[id]` - Get team details
- `PATCH /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Archive team

### Members
- `GET /api/members` - List all members
- `POST /api/members` - Create a new member
- `GET /api/members/[id]` - Get member details
- `PATCH /api/members/[id]` - Update member
- `DELETE /api/members/[id]` - Deactivate member

### Focus Periods
- `GET /api/focus-periods` - List all focus periods
- `POST /api/focus-periods` - Create a new focus period
- `GET /api/focus-periods/[id]` - Get focus period details
- `PATCH /api/focus-periods/[id]` - Update focus period
- `DELETE /api/focus-periods/[id]` - Deactivate focus period

### Work Items
- `GET /api/work-items` - List all work items
- `POST /api/work-items` - Create/sync work item
- `GET /api/work-items/[id]` - Get work item details
- `PATCH /api/work-items/[id]` - Update work item

### Allocations
- `GET /api/allocations` - List all allocations
- `POST /api/allocations` - Create allocation
- `GET /api/allocations/[id]` - Get allocation details
- `PATCH /api/allocations/[id]` - Update allocation
- `DELETE /api/allocations/[id]` - Remove allocation

## Development

### Project Structure

```
focus-planning/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── teams/          # Teams pages
│   │   ├── focus-periods/  # Focus periods pages
│   │   ├── work-items/     # Work items pages
│   │   ├── capacity/       # Capacity overview pages
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/         # Reusable React components
│   ├── lib/               # Utility functions and configs
│   │   └── db.ts          # Database connection
│   └── types/             # TypeScript type definitions
├── database/
│   └── schema.sql         # Database schema
├── public/                # Static assets
├── .env.example          # Environment variables template
├── next.config.js        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

The project uses:
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for consistent styling

## Deployment

### Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

### Database Setup

Ensure your production database is created and the schema is applied before deploying the application.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Maintainability

This project emphasizes maintainability through:

- **Clear Separation of Concerns**: API routes, components, and business logic are well-organized
- **Type Safety**: TypeScript throughout the codebase
- **Consistent Code Style**: ESLint and Prettier configurations
- **Database Abstraction**: Centralized database connection management
- **Environment Configuration**: All configuration via environment variables
- **Documentation**: Comprehensive inline comments and README

## License

This project is licensed under the ISC License.

## Support

For issues, questions, or contributions, please open an issue in the GitHub repository.

## Acknowledgments

- Next.js team for the excellent framework
- Microsoft for Azure DevOps API and MSSQL
- Tailwind CSS for the utility-first CSS framework
