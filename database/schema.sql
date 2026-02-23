-- Create database if not exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'focus_planning')
BEGIN
    CREATE DATABASE focus_planning;
END
GO

USE focus_planning;
GO

-- Teams table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Teams')
BEGIN
    CREATE TABLE Teams (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX),
        is_archived BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Team Members table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TeamMembers')
BEGIN
    CREATE TABLE TeamMembers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        team_id INT NOT NULL,
        name NVARCHAR(200) NOT NULL,
        email NVARCHAR(200),
        role NVARCHAR(100),
        default_capacity_days DECIMAL(5,2),
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (team_id) REFERENCES Teams(id)
    );
END
GO

-- Focus Periods table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FocusPeriods')
BEGIN
    CREATE TABLE FocusPeriods (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        capacity_model DECIMAL(5,2) DEFAULT 80.0,
        azdo_iteration_path NVARCHAR(500),
        azdo_tag NVARCHAR(200),
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Work Items (Ergebnis) table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkItems')
BEGIN
    CREATE TABLE WorkItems (
        id INT IDENTITY(1,1) PRIMARY KEY,
        azdo_id INT UNIQUE NOT NULL,
        title NVARCHAR(500) NOT NULL,
        state NVARCHAR(100),
        owner NVARCHAR(200),
        tags NVARCHAR(MAX),
        effort DECIMAL(10,2),
        focus_period_id INT,
        last_synced_at DATETIME2,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (focus_period_id) REFERENCES FocusPeriods(id)
    );
END
GO

-- Capacity Allocations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CapacityAllocations')
BEGIN
    CREATE TABLE CapacityAllocations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        team_member_id INT NOT NULL,
        work_item_id INT NOT NULL,
        focus_period_id INT NOT NULL,
        allocated_days DECIMAL(5,2) NOT NULL,
        allocated_percentage DECIMAL(5,2),
        start_date DATE,
        end_date DATE,
        notes NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (team_member_id) REFERENCES TeamMembers(id),
        FOREIGN KEY (work_item_id) REFERENCES WorkItems(id),
        FOREIGN KEY (focus_period_id) REFERENCES FocusPeriods(id)
    );
END
GO

-- Member Availability Overrides table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MemberAvailability')
BEGIN
    CREATE TABLE MemberAvailability (
        id INT IDENTITY(1,1) PRIMARY KEY,
        team_member_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        available_days DECIMAL(5,2) NOT NULL,
        reason NVARCHAR(200),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (team_member_id) REFERENCES TeamMembers(id)
    );
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_team_members_team_id' AND object_id = OBJECT_ID('TeamMembers'))
    CREATE INDEX idx_team_members_team_id ON TeamMembers(team_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_work_items_focus_period' AND object_id = OBJECT_ID('WorkItems'))
    CREATE INDEX idx_work_items_focus_period ON WorkItems(focus_period_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_work_items_azdo_id' AND object_id = OBJECT_ID('WorkItems'))
    CREATE INDEX idx_work_items_azdo_id ON WorkItems(azdo_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capacity_allocations_member' AND object_id = OBJECT_ID('CapacityAllocations'))
    CREATE INDEX idx_capacity_allocations_member ON CapacityAllocations(team_member_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capacity_allocations_work_item' AND object_id = OBJECT_ID('CapacityAllocations'))
    CREATE INDEX idx_capacity_allocations_work_item ON CapacityAllocations(work_item_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_capacity_allocations_focus' AND object_id = OBJECT_ID('CapacityAllocations'))
    CREATE INDEX idx_capacity_allocations_focus ON CapacityAllocations(focus_period_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_member_availability_member' AND object_id = OBJECT_ID('MemberAvailability'))
    CREATE INDEX idx_member_availability_member ON MemberAvailability(team_member_id);
GO
