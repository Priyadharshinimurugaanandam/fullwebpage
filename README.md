# Surgical Robotics Insights Dashboard

A comprehensive, interactive web application for analyzing surgical data with real-time filtering and visualization capabilities.

## Features

- **CSV Data Upload**: Import surgical data with comprehensive parsing
- **Dynamic Filtering**: Filter by procedures and surgeons with real-time updates
- **Multiple Dashboard Views**: 
  - Default overview with procedure summaries
  - Procedure-specific analytics
  - Surgeon-specific performance metrics
  - Combined filtered insights
- **Interactive Visualizations**: Progress bars, charts, and professional cards
- **Responsive Design**: Professional layout optimized for all screen sizes
- **Real-time Analytics**: Instant calculations of averages, totals, and percentages

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: React Context API with hooks
- **Styling**: Tailwind CSS with custom components
- **Data Processing**: PapaParse for CSV parsing
- **Icons**: Lucide React
- **Build Tool**: Vite

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:5173`

## CSV Data Format

The application expects CSV files with the following columns:

- `procedure_name`: Name of the surgical procedure
- `date`: Surgery date (YYYY-MM-DD format)
- `time`: Surgery time (HH:MM format)
- `duration`: Surgery duration in minutes
- `surgeon_name`: Name of the performing surgeon
- `surgeon_image`: URL to surgeon's profile image
- `instruments_names`: Comma-separated list of instrument names
- `instruments_images`: Comma-separated list of instrument image URLs
- `instruments_durations`: Comma-separated list of instrument usage durations
- `clutch_names`: Comma-separated list of clutch names
- `clutch_counts`: Comma-separated list of clutch usage counts

## Dashboard Views

### Default View (No Filters)
- Last procedure summary
- Total cases and average time
- Instrument usage from last case
- Procedure volume breakdown

### Procedure-Specific View
- Best performance metrics for selected procedure
- Average instrument usage patterns
- Detailed analysis of optimal surgery

### Surgeon-Specific View
- Surgeon performance summary
- Last surgery details with instruments
- Clutch usage analytics

### Combined Filter View
- Intersection analysis of surgeon + procedure
- Comprehensive instrument analytics
- Performance metrics for specific combinations

## Usage

1. **Upload Data**: Click "Upload CSV Data" to import your surgical records
2. **Apply Filters**: Use the dropdown menus to filter by procedure and/or surgeon
3. **Analyze Results**: View dynamically updated analytics in the main dashboard
4. **Quick Stats**: Monitor key metrics in the sidebar quick stats panel

## Key Features

- **Professional Design**: Clean, medical-grade interface with intuitive navigation
- **Real-time Updates**: Instant recalculation of metrics when filters change
- **Comprehensive Analytics**: Deep insights into surgical performance and efficiency
- **Error Handling**: Robust CSV validation with user-friendly error messages
- **Sample Data**: Pre-loaded example data for immediate exploration

## Build for Production

```bash
npm run build
```

The built files will be available in the `dist/` directory.

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

---

*Built with modern web technologies for optimal performance and user experience.*