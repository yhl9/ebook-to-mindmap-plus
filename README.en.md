# E-book to Mind Map

An intelligent e-book parsing tool powered by AI technology that converts EPUB, PDF, Word and HTML format documents, as well as web URLs, into structured mind maps and text summaries.

## ✨ Features

### 📚 Multi-format Support

- **EPUB Files**: Complete support for parsing and processing EPUB format e-books
- **PDF Files**: Intelligent PDF document parsing with table of contents-based and smart chapter extraction
- **Word Files**: Support for DOCX and DOC format document parsing and chapter extraction
  - Recommended to use DOCX format for best compatibility
  - Support for HTML structure-based title chapter extraction
  - Intelligent recognition of title styles and chapter structure in Word documents
- **HTML Files**: Support for HTML and HTM format document parsing and chapter extraction
  - Intelligent parsing of HTML document structure, extracting titles and content
  - Support for chapter detection based on HTML heading tags (h1-h6)
  - Automatic filtering of navigation, footer and other non-content elements
  - Support for extracting document title and author information from meta tags
- **Web URLs**: Support for direct web URL input to fetch and parse content
  - Automatically fetch web HTML content and parse chapter structure
  - Intelligent extraction of web page titles and author information
  - Support for various web formats (news articles, blogs, technical documents, etc.)
  - Automatic handling of CORS restrictions and network issues
- **Text Input**: Support for direct text input or pasting
  - Support up to 2000 characters of text content input
  - Intelligently analyze text structure and extract chapters
  - Support multiple chapter format recognition (Chapter X, 第X章, etc.)
  - Automatically extract titles and author information

### 🤖 AI-Powered Content Processing

- **Multiple AI Services**: Support for Google Gemini and OpenAI GPT models
- **Three Processing Modes**:
  - 📝 **Text Summary Mode**: Generate chapter summaries, analyze chapter relationships, output complete book summary
  - 🧠 **Chapter Mind Map Mode**: Generate independent mind maps for each chapter
  - 🌐 **Whole Book Mind Map Mode**: Integrate entire book content into one comprehensive mind map

### 🎯 Smart Chapter Processing

- **Intelligent Chapter Detection**: Automatically identify and extract book chapter structure
- **Chapter Filtering**: Support skipping prefaces, table of contents, acknowledgments and other non-core content
- **Flexible Selection**: Users can freely choose chapters to process
- **Sub-chapter Support**: Configurable sub-chapter extraction depth

### 💾 Efficient Caching Mechanism

- **Smart Caching**: Automatically cache AI processing results to avoid redundant computation
- **Cache Management**: Support clearing cache by mode to save storage space
- **Offline Viewing**: Processed content can be viewed offline

### 🎨 Modern Interface

- **Responsive Design**: Adapts to various screen sizes
- **Real-time Progress**: Visualized processing with real-time step display
- **Interactive Mind Maps**: Support zooming, dragging, node expand/collapse
- **Content Preview**: Support viewing original chapter content

## 🚀 Quick Start

### Requirements

- Node.js 18+
- pnpm (recommended) or npm

### Install Dependencies

```bash
# Clone the project
git clone https://github.com/SSShooter/ebook-to-mindmap
cd ebook-to-mindmap

# Install dependencies
pnpm install
# or
npm install
```

### Start Development Server

```bash
pnpm dev
# or
npm run dev
```

Visit `http://localhost:5173` to start using.

## 📖 User Guide

### 1. Configure AI Service

First-time use requires AI service configuration:

1. Click the "Configure" button
2. Select AI service provider:
   - **Google Gemini** (recommended): Requires Gemini API Key
   - **OpenAI GPT**: Requires OpenAI API Key and API address
3. Enter the corresponding API Key
4. Select model (optional, default model works fine)

#### Getting API Keys

**Google Gemini API Key**:

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with Google account
3. Create a new API Key
4. Copy the API Key to configuration

**OpenAI API Key**:

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in and go to API Keys page
3. Create a new API Key
4. Copy the API Key to configuration

Here are some [free alternatives](https://github.com/SSShooter/Video-Summary/blob/master/guide/index.md) for reference.

### 2. Upload E-book File, Enter Web URL, or Paste Text Content

**Method 1: File Upload**
1. Select "File Upload" mode
2. Click "Select EPUB, PDF, Word or HTML File" button
3. Choose the document file to process
4. Supported formats: `.epub`, `.pdf`, `.docx`, `.doc`, `.html`, `.htm`

**Method 2: Web URL**
1. Select "Web URL" mode
2. Enter web page URL in the input box (e.g., `https://www.cnblogs.com/blogaz/p/7472829.html`)
3. System will automatically fetch web content and parse chapters

**Method 3: Text Input**
1. Select "Text Input" mode
2. Directly input or paste text content in the text box
3. Support up to 2000 characters of text content
4. System will intelligently analyze text structure and extract chapters

### 3. Configure Processing Options

Set processing parameters in the configuration dialog:

#### Processing Mode

- **Text Summary Mode**: Suitable for scenarios requiring text summaries
- **Chapter Mind Map Mode**: Generate independent mind maps for each chapter
- **Whole Book Mind Map Mode**: Generate unified mind map for the entire book

#### Book Type

- **Fiction**: Suitable for novels and story books
- **Non-fiction**: Suitable for textbooks, reference books, technical books, etc.

#### Advanced Options

- **Smart Chapter Detection**: When enabled, uses AI to intelligently identify chapter boundaries
- **Skip Irrelevant Chapters**: Automatically skip prefaces, table of contents, acknowledgments, etc.
- **Sub-chapter Depth**: Set the hierarchy depth for extracting sub-chapters (0-3)

### 4. Extract Chapters

1. Click "Extract Chapters" button
2. System will automatically parse the file and extract chapter structure
3. After extraction, chapter list will be displayed
4. You can select chapters to process (all selected by default)

### 5. Start Processing

1. Confirm selected chapters
2. Click "Start Processing" button
3. System will display processing progress and current steps
4. Results will be shown after completion

### 6. View Results

Depending on the selected processing mode, you can view different types of results:

#### Text Summary Mode

- **Chapter Summaries**: Detailed summary of each chapter
- **Chapter Relationships**: Analysis of logical relationships between chapters
- **Book Summary**: Core content summary of the entire book

#### Mind Map Mode

- **Interactive Mind Maps**: Zoomable, draggable mind maps
- **Node Details**: Click nodes to view detailed content
- **Export Function**: Support exporting as images or other formats

## 🛠️ Technical Architecture

### Add AI supplier manually 
Add AI supplier manually [how to](docs/en/ai-providers-configuration.md)

### Core Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **File Parsing**:
  - EPUB: @smoores/epub + epubjs
  - PDF: pdfjs-dist
- **Mind Maps**: mind-elixir
- **AI Services**:
  - Google Gemini: @google/generative-ai
  - OpenAI: Custom implementation

## 🔧 Advanced Features

### Cache Management

System automatically caches AI processing results for improved efficiency:

- **Auto Caching**: Processing results are automatically saved locally
- **Smart Reuse**: Identical content won't be processed repeatedly
- **Cache Cleanup**: Can clear specific types of cache by mode
- **Storage Optimization**: Cache data is compressed to save storage space

### Batch Processing

- **Chapter Selection**: Support batch select/deselect chapters
- **Concurrent Processing**: Multiple chapters can be processed in parallel (subject to API limits)
- **Resume Processing**: Can continue from last position after interruption

### Export Functions

- **Mind Map Export**: Support exporting as PNG, SVG and other formats
- **Text Summary Export**: Support exporting as Markdown, TXT formats
- **Data Backup**: Support exporting processing result data

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Thanks to the following open source projects:

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [mind-elixir](https://github.com/ssshooter/mind-elixir-core)
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [epub.js](https://github.com/futurepress/epub.js/)

---

For questions or suggestions, please submit an Issue or contact the developer.
