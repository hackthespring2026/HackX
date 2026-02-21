# Smart Cash Flow Predictor

A full-stack web app for small businesses to upload monthly finance CSV data, compute deterministic cash-flow metrics, and visualize business risk indicators.

## Tech Stack

- Frontend: React (Create React App), React Router DOM, Axios, Chart.js via react-chartjs-2, plain CSS
- Backend: Node.js, Express.js, Multer, csv-parser, cors

## Folder Structure

```
smart-cashflow-predictor/
|-- client/
|   |-- package.json
|   |-- public/
|   |   `-- index.html
|   `-- src/
|       |-- components/
|       |   |-- Navbar.js
|       |   |-- FileUpload.js
|       |   |-- Charts.js
|       |   `-- SummaryCards.js
|       |-- pages/
|       |   |-- Landing.js
|       |   `-- DashboardPage.js
|       |-- App.js
|       |-- index.js
|       `-- App.css
|-- server/
|   |-- package.json
|   |-- server.js
|   |-- routes/
|   |   `-- financeRoutes.js
|   |-- controllers/
|   |   `-- financeController.js
|   |-- services/
|   |   `-- calculationService.js
|   |-- utils/
|   |   `-- csvParser.js
|   `-- uploads/
`-- README.md
```

## CSV Format (Strict)

Columns:

`Month,Opening_Cash,Revenue,Fixed_Cost,Variable_Cost,Inventory_Cost,Loan_EMI`

## Run Backend

```bash
cd server
npm install
node server.js
```

Server runs on `http://localhost:5000`

## Run Frontend

```bash
cd client
npm install
npm start
```

Frontend runs on `http://localhost:3000`

## API Endpoint

- `POST /api/finance/upload`
- Form field name: `file`
- Content type: `multipart/form-data`
