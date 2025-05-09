# React Image Alt Text Generator

A React application that uses AI vision models via OpenRouter to automatically generate alt text for images and descriptions for PDF pages, with automatic translation to French.

## Features

- **Multi-file Processing**: Upload and process multiple image files (PNG, JPG, JPEG) and PDF documents in a single batch
- **PDF Support**: Extract and analyze individual pages from PDF documents
- **Bilingual Output**: Generate alt text in English with automatic French translation
- **AI-Powered**: Leverages advanced vision models through OpenRouter API
- **Accessibility Focus**: Creates concise, descriptive alt text optimized for web accessibility
- **Detailed PDF Analysis**: Extracts and describes text content from PDF pages
- **Results Export**: Download all generated alt text and descriptions as a CSV file
- **Responsive UI**: Progress tracking and organized results display

## Available Models

The application currently supports the following vision models:

- **Qwen 2.5 VL 32B** (Free tier available through OpenRouter)
- **OpenAI GPT-4o-mini**

## Installation

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn
- An OpenRouter API key ([Get one here](https://openrouter.ai/keys))

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/react_image_alt.git
   cd react_image_alt
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Build for production:
   ```bash
   npm run build
   # or
   yarn build
   ```

## Usage

1. **Enter your OpenRouter API Key**:
   - When you first open the application, you'll be prompted to enter your OpenRouter API key
   - You can also pass the key via URL parameter: `?key=your-api-key-here`

2. **Select a Vision Model**:
   - Choose between Qwen 2.5 VL (free) or GPT-4o-mini from the dropdown menu

3. **Upload Files**:
   - Click the file upload area to select images (PNG, JPG, JPEG) or PDF files
   - You can select multiple files at once

4. **View Results**:
   - The application will process each file and display the results
   - For images: concise alt text in English and French
   - For PDFs: detailed descriptions of each page in English and French

5. **Export Results**:
   - Click "Download Results as CSV" to save all generated text in a spreadsheet format

## API Key Setup

To use this application, you need an OpenRouter API key:

1. Create an account at [OpenRouter](https://openrouter.ai)
2. Navigate to the API Keys section
3. Create a new API key
4. Enter this key in the application when prompted

## Technical Details

- Built with React 19 and TypeScript
- Uses Vite as the build tool
- Integrates with OpenRouter API for AI model access
- Uses PDF.js for PDF processing
- Automatically resizes images to optimize for API usage

## How It Works

1. Images are resized to optimal dimensions for vision models (max 1024x1024)
2. PDF files are processed page by page, with each page converted to an image
3. The application sends each image to the selected vision model via OpenRouter
4. For images, the model generates concise alt text (15-20 words)
5. For PDF pages, the model extracts and describes all content
6. English text is automatically translated to French using Mixtral 8x7B
7. Results are displayed in the UI and can be exported as CSV

## Limitations

- The free tier of OpenRouter has rate limits that may affect processing speed
- Very large PDF files may take longer to process
- Image quality and complexity can affect the accuracy of generated alt text

## License

ISC