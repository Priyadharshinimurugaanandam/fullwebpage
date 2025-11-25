# MISSO System Insights - Code Guide

## Overview
This is a surgical data analytics dashboard that displays insights about surgical procedures, surgeon performance, and instrument usage.

## Application Structure

### Main Files
- **App.tsx** - Root component that wraps everything with DataProvider
- **main.tsx** - Entry point that renders the app
- **index.css** - Global styles with Tailwind CSS

### Layout Components

#### Header.tsx
- Fixed header at the top with logo and title
- Height: 64px (4rem)

#### Sidebar.tsx
- Fixed left sidebar (width: 256px/64 in Tailwind)
- Contains:
  - CSV Upload button
  - Export Report button
  - Procedure filter dropdown
  - Surgeon filter dropdown
  - Quick Stats card

#### Dashboard.tsx
- Main content area (starts 64px from top, 256px from left)
- Displays different views based on selected filters:
  - **DefaultView**: No filters selected - shows overview
  - **ProcedureView**: Procedure filter selected
  - **SurgeonView**: Surgeon filter selected
  - **CombinedView**: Both filters selected

### View Components (src/components/views/)

#### DefaultView.tsx
Shows overall statistics when no filters are selected:
- Last procedure details
- Total cases and average time
- Instruments used in last case
- Procedure volume breakdown

#### ProcedureView.tsx
Shows data filtered by procedure type:
- Best procedure time stats
- Instrument usage volume
- Best surgery details with instruments

#### SurgeonView.tsx
Shows data filtered by surgeon:
- Surgeon summary with photo
- Total cases and average time
- Last surgery details
- Surgery duration timeline chart
- Clutch usage statistics
- Best surgery performance

#### CombinedView.tsx
Shows data filtered by both procedure and surgeon:
- Combined summary stats
- Latest surgery details
- Instrument analytics

### Utility Components

#### CSVUpload.tsx
- Handles CSV file upload
- Uses PapaParse to parse CSV data
- Updates the surgery data in context

#### ExportReport.tsx
- Generates text report of current filtered data
- Downloads report as .txt file using file-saver

#### ProgressBar.tsx
- Reusable progress bar component
- Shows percentages with optional duration
- Available sizes: sm, md, lg

#### QuickStatsCard.tsx
- Shows 4 key metrics:
  - Total Cases
  - Average Time
  - Instruments
  - Clutch Usage

### Data Management

#### DataContext.tsx
**Core State:**
- `surgeries` - All surgery data
- `filters` - Current procedure/surgeon filters
- `filteredSurgeries` - Computed filtered results
- `isLoading` - Loading state

**Sample Data:**
Includes 4 sample surgeries with realistic data for testing

**Processing Functions:**
- `processSurgicalData()` - Transforms raw CSV data into usable format
- `parseInstruments()` - Parses comma-separated instrument data
- `parseClutches()` - Parses comma-separated clutch data

#### types/index.ts
Type definitions:
- `SurgicalData` - Raw CSV data structure
- `ProcessedSurgery` - Enhanced data with parsed arrays
- `ParsedInstrument` - Individual instrument data
- `ParsedClutch` - Individual clutch data
- `DashboardFilters` - Filter state
- `QuickStats` - Statistics data

## Key Design Patterns

### Layout System
- Fixed header (top)
- Fixed sidebar (left, 256px wide)
- Main content area (offset by header and sidebar)
- Uses Tailwind CSS for all styling

### Color Scheme
- Primary: `#00938e` (teal)
- Background: `#d2e2eb` (light blue-gray)
- White cards with teal borders
- Gray text for secondary information

### Responsive Grid
All views use responsive grid:
```jsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
  <div className="lg:col-span-3">...</div>  // 25%
  <div className="lg:col-span-4">...</div>  // 33%
  <div className="lg:col-span-5">...</div>  // 42%
</div>
```

### Data Flow
1. CSV Upload → Parse data → Update context
2. Context holds all data and filters
3. Views read filtered data from context
4. Filter changes trigger view re-render

## CSV Format Expected

The app expects CSV files with these columns:
- procedure_name
- date
- time
- duration
- surgeon_name
- surgeon_image (URL)
- instruments_names (comma-separated)
- instruments_images (comma-separated)
- instruments_durations (comma-separated)
- clutch_names (comma-separated)
- clutch_counts (comma-separated)

## How to Use

1. **View Sample Data**: App loads with 4 sample surgeries
2. **Filter Data**: Use sidebar dropdowns to filter by procedure or surgeon
3. **Upload CSV**: Click "Upload CSV Data" to load your own data
4. **Export Report**: Click "Export Report" to download current view as text file

## Common Customizations

### Add New View
1. Create new component in `src/components/views/`
2. Add condition in `Dashboard.tsx` renderView()
3. Access filtered data with `useData()` hook

### Modify Stats
1. Edit calculation logic in respective view files
2. Update QuickStatsCard.tsx for sidebar stats

### Change Colors
1. Replace `#00938e` with your brand color
2. Update `#d2e2eb` for background color

## Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Built files go to `/dist` directory.
