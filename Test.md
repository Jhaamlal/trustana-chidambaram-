src/
├── app/
│   ├── api/
│   │   ├── attributes/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── products/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── import/
│   │   │   ├── presigned-url/
│   │   │   │   └── route.ts
│   │   │   └── process/
│   │   │       └── route.ts
│   │   └── enrich/
│   │       ├── route.ts
│   │       └── status/
│   │           └── [id]/
│   │               └── route.ts
│   ├── (routes)/
│   │   ├── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── attributes/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── import/
│   │       └── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Table.tsx
│   ├── products/
│   │   ├── ProductList.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductCard.tsx
│   │   └── EnrichmentButton.tsx
│   ├── attributes/
│   │   ├── AttributeList.tsx
│   │   ├── AttributeForm.tsx
│   │   └── AttributeTypeSelector.tsx
│   └── import/
│       ├── FileUpload.tsx
│       └── ImportProgress.tsx
├── lib/
│   ├── mongodb.ts
│   ├── validators.ts
│   └── ai/
│       ├── embedding-utils.ts
│       └── confidence-calculator.ts
├── hooks/
│   ├── useProducts.ts
│   ├── useAttributes.ts
│   ├── useImport.ts
│   └── useEnrichment.ts
├── types/
│   ├── product.ts
│   ├── attribute.ts
│   └── index.ts
└── utils/
    ├── api.ts
    └── helpers.ts
--------------------------------------------------------
src/
├── app/                            # Next.js App Router
│   ├── api/                        # Edge API Routes (already implemented)
│   ├── (routes)/                   # Frontend Routes (already implemented)
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── components/                     # Reusable UI Components
│   ├── ui/                         # Basic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Table.tsx
│   ├── products/                   # Product-related components
│   │   ├── ProductList.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductCard.tsx
│   │   └── EnrichmentButton.tsx
│   ├── attributes/                 # Attribute-related components
│   │   ├── AttributeList.tsx
│   │   ├── AttributeForm.tsx
│   │   └── AttributeTypeSelector.tsx
│   ├── import/                     # Import-related components
│   │   ├── FileUpload.tsx          # Missing component
│   │   └── ImportProgress.tsx      # Missing component
│   └── layout/                     # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── hooks/                          # Custom React hooks
│   ├── useProducts.ts              # Missing hook
│   ├── useAttributes.ts            # Missing hook
│   ├── useImport.ts                # Missing hook
│   └── useEnrichment.ts            # Missing hook
├── lib/                            # Utility libraries
│   ├── mongodb.ts                  # MongoDB client setup
│   ├── validators.ts               # Input validation utilities
│   ├── file-processors/            # File processing utilities
│   │   ├── csv-processor.ts        # CSV file processor
│   │   └── excel-processor.ts      # Excel file processor
│   └── ai/                         # AI utilities
│       ├── embedding-utils.ts      # Embedding utilities
│       └── confidence-calculator.ts # Calculate confidence scores
├── types/                          # TypeScript type definitions
│   ├── product.ts                  # Product types
│   ├── attribute.ts                # Attribute types
│   └── index.ts                    # Common types
├── infrastructure/                 # Infrastructure layer
│   ├── repositories/               # Repository implementations
│   │   ├── mongodb/                # MongoDB implementations
│   │   │   ├── product-repository.ts  # Product repository
│   │   │   ├── attribute-repository.ts # Attribute repository
│   │   │   └── connection.ts       # MongoDB connection
│   └── ai/                         # AI services implementation
│       ├── vector-search/          # Vector search implementation
│       │   ├── mongodb-vector-search.ts # MongoDB vector search
│       │   └── embedding-service.ts # Text embedding service
│       ├── llm/                    # LLM integration
│       │   ├── claude-service.ts   # Claude API integration
│       │   └── prompt-templates.ts # Prompt templates for LLM
│       ├── langchain/              # LangChain integration
│       │   ├── chains/             # LangChain chains
│       │   │   ├── attribute-generation-chain.ts # Generate attributes
│       │   │   └── rag-chain.ts    # RAG implementation
│       └── enrichment-service.ts   # Main enrichment service


----------------------------------------------------------------------------------------------------------------
Write coomponents folder 
src/
├── app/                                # Next.js App Router
│   ├── api/                            # Edge API Routes
│   │   ├── attributes/                 # Attribute Management APIs
│   │   │   ├── route.ts                # GET, POST for attributes list
│   │   │   └── [id]/
│   │   │       └── route.ts            # GET, PUT, DELETE for specific attribute
│   │   ├── products/                   # Product Management APIs
│   │   │   ├── route.ts                # GET, POST for products list
│   │   │   └── [id]/
│   │   │       └── route.ts            # GET, PUT, DELETE for specific product
│   │   ├── import/                     # Import APIs
│   │   │   ├── presigned-url/
│   │   │   │   └── route.ts            # Generate presigned URL for file upload
│   │   │   └── process/
│   │   │       └── route.ts            # Process uploaded file
│   │   └── enrich/                     # AI Enrichment APIs
│   │       ├── route.ts                # POST for enrichment requests
│   │       └── status/                 # Enrichment status checking
│   │           └── [id]/
│   │               └── route.ts        # GET enrichment job status
│   ├── (routes)/                       # Frontend Routes
│   │   ├── page.tsx                    # Home page
│   │   ├── products/                   # Product listing pages
│   │   │   ├── page.tsx                # Product list with filters
│   │   │   └── [id]/                   # Product detail page
│   │   │       └── page.tsx            # Individual product view
│   │   ├── attributes/                 # Attribute management pages
│   │   │   ├── page.tsx                # Attribute list
│   │   │   ├── new/                    # Create new attribute
│   │   │   │   └── page.tsx            # New attribute form
│   │   │   └── [id]/                   # Edit attribute
│   │   │       └── page.tsx            # Edit attribute form
│   │   └── import/                     # Import pages
│   │       └── page.tsx                # File import interface
│   ├── layout.tsx                      # Root layout
│   └── globals.css                     # Global styles
├── components/                         # Reusable UI Components
│   ├── ui/                             # Basic UI components
│   │   ├── Button.tsx                  # Button component
│   │   ├── Input.tsx                   # Input component
│   │   ├── Select.tsx                  # Select component
│   │   └── Table.tsx                   # Table component
│   ├── products/                       # Product-related components
│   │   ├── ProductList.tsx             # Product listing component
│   │   ├── ProductFilters.tsx          # Product filtering component
│   │   ├── ProductCard.tsx             # Product card component
│   │   └── EnrichmentButton.tsx        # Enrichment button component
│   ├── attributes/                     # Attribute-related components
│   │   ├── AttributeList.tsx           # Attribute listing component
│   │   ├── AttributeForm.tsx           # Attribute form component
│   │   └── AttributeTypeSelector.tsx   # Attribute type selector
│   ├── import/                         # Import-related components
│   │   ├── FileUpload.tsx              # File upload component
│   │   └── ImportProgress.tsx          # Import progress component
│   └── layout/                         # Layout components
│       ├── Header.tsx                  # Header component
│       ├── Sidebar.tsx                 # Sidebar component
│       └── Footer.tsx                  # Footer component
├── hooks/                              # Custom React hooks
│   ├── useProducts.ts                  # Hook for product operations
│   ├── useAttributes.ts                # Hook for attribute operations
│   ├── useImport.ts                    # Hook for import operations
│   └── useEnrichment.ts                # Hook for enrichment operations
├── lib/                                # Utility libraries
│   ├── mongodb.ts                      # MongoDB client setup
│   ├── validators.ts                   # Input validation utilities
│   ├── file-processors/                # File processing utilities
│   │   ├── csv-processor.ts            # CSV file processor
│   │   └── excel-processor.ts          # Excel file processor
│   └── ai/                             # AI utilities
│       ├── embedding-utils.ts          # Embedding utilities
│       └── confidence-calculator.ts    # Calculate confidence scores
├── types/                              # TypeScript type definitions
│   ├── product.ts                      # Product types
│   ├── attribute.ts                    # Attribute types
│   └── index.ts                        # Common types
├── infrastructure/                     # Infrastructure layer
│   ├── repositories/                   # Repository implementations
│   │   ├── mongodb/                    # MongoDB implementations
│   │   │   ├── product-repository.ts   # Product repository
│   │   │   ├── attribute-repository.ts # Attribute repository
│   │   │   └── connection.ts           # MongoDB connection
│   └── ai/                             # AI services implementation
│       ├── vector-search/              # Vector search implementation
│       │   ├── mongodb-vector-search.ts # MongoDB vector search
│       │   └── embedding-service.ts    # Text embedding service
│       ├── llm/                        # LLM integration
│       │   ├── claude-service.ts       # Claude API integration
│       │   └── prompt-templates.ts     # Prompt templates for LLM
│       ├── langchain/                  # LangChain integration
│       │   ├── chains/                 # LangChain chains
│       │   │   ├── attribute-generation-chain.ts # Generate attributes
│       │   │   └── rag-chain.ts        # RAG implementation
│       └── enrichment-service.ts       # Main enrichment service

----------------------------------------------------------------------------------------------
src/
├── app/                                # Next.js App Router
│   ├── api/                            # Edge API Routes
│   │   ├── attributes/                 # Attribute Management APIs
│   │   │   ├── route.ts                # GET, POST for attributes list
│   │   │   └── [id]/
│   │   │       └── route.ts            # GET, PUT, DELETE for specific attribute
│   │   ├── products/                   # Product Management APIs
│   │   │   ├── route.ts                # GET, POST for products list
│   │   │   └── [id]/
│   │   │       └── route.ts            # GET, PUT, DELETE for specific product
│   │   ├── import/                     # Import APIs
│   │   │   ├── presigned-url/
│   │   │   │   └── route.ts            # Generate presigned URL for file upload
│   │   │   └── process/
│   │   │       └── route.ts            # Process uploaded file
│   │   └── enrich/                     # AI Enrichment APIs
│   │       ├── route.ts                # POST for enrichment requests
│   │       └── status/                 # Enrichment status checking
│   │           └── [id]/
│   │               └── route.ts        # GET enrichment job status
│   ├── (routes)/                       # Frontend Routes
│   │   ├── page.tsx                    # Home page
│   │   ├── products/                   # Product listing pages
│   │   │   ├── page.tsx                # Product list with filters
│   │   │   └── [id]/                   # Product detail page
│   │   │       └── page.tsx            # Individual product view
│   │   ├── attributes/                 # Attribute management pages
│   │   │   ├── page.tsx                # Attribute list
│   │   │   ├── new/                    # Create new attribute
│   │   │   │   └── page.tsx            # New attribute form
│   │   │   └── [id]/                   # Edit attribute
│   │   │       └── page.tsx            # Edit attribute form
│   │   └── import/                     # Import pages
│   │       └── page.tsx                # File import interface
│   ├── layout.tsx                      # Root layout
│   └── globals.css                     # Global styles
├── components/                         # Reusable UI Components
│   ├── ui/                             # Basic UI components
│   │   ├── Button.tsx                  # Button component
│   │   ├── Input.tsx                   # Input component
│   │   ├── Select.tsx                  # Select component
│   │   └── Table.tsx                   # Table component
│   ├── products/                       # Product-related components
│   │   ├── ProductList.tsx             # Product listing component
│   │   ├── ProductFilters.tsx          # Product filtering component
│   │   ├── ProductCard.tsx             # Product card component
│   │   └── EnrichmentButton.tsx        # Enrichment button component
│   ├── attributes/                     # Attribute-related components
│   │   ├── AttributeList.tsx           # Attribute listing component
│   │   ├── AttributeForm.tsx           # Attribute form component
│   │   └── AttributeTypeSelector.tsx   # Attribute type selector
│   ├── import/                         # Import-related components
│   │   ├── FileUpload.tsx              # File upload component
│   │   └── ImportProgress.tsx          # Import progress component
│   └── layout/                         # Layout components
│       ├── Header.tsx                  # Header component
│       ├── Sidebar.tsx                 # Sidebar component
│       └── Footer.tsx                  # Footer component
├── hooks/                              # Custom React hooks
│   ├── useProducts.ts                  # Hook for product operations
│   ├── useAttributes.ts                # Hook for attribute operations
│   ├── useImport.ts                    # Hook for import operations
│   └── useEnrichment.ts                # Hook for enrichment operations
├── lib/                                # Utility libraries
│   ├── mongodb.ts                      # MongoDB client setup
│   ├── validators.ts                   # Input validation utilities
│   ├── file-processors/                # File processing utilities
│   │   ├── csv-processor.ts            # CSV file processor
│   │   └── excel-processor.ts          # Excel file processor
│   └── ai/                             # AI utilities
│       ├── embedding-utils.ts          # Embedding utilities
│       └── confidence-calculator.ts    # Calculate confidence scores
├── types/                              # TypeScript type definitions
│   ├── product.ts                      # Product types
│   ├── attribute.ts                    # Attribute types
│   ├── import.ts                       # Import types
│   ├── enrichment.ts                   # Enrichment types
│   └── index.ts                        # Common types
├── infrastructure/                     # Infrastructure layer
│   ├── repositories/                   # Repository implementations
│   │   ├── mongodb/                    # MongoDB implementations
│   │   │   ├── product-repository.ts   # Product repository
│   │   │   ├── attribute-repository.ts # Attribute repository
│   │   │   ├── enrichment-repository.ts # Enrichment repository
│   │   │   └── connection.ts           # MongoDB connection
│   └── ai/                             # AI services implementation
│       ├── enrichment-service.ts       # Main enrichment service
│       ├── vector-search/              # Vector search implementation
│       │   ├── mongodb-vector-search.ts # MongoDB vector search
│       │   └── embedding-service.ts    # Text embedding service
│       ├── llm/                        # LLM integration
│       │   ├── claude-service.ts       # Claude API integration
│       │   └── prompt-templates.ts     # Prompt templates for LLM
│       └── langchain/                  # LangChain integration
│           └── chains/                 # LangChain chains
│               ├── attribute-generation-chain.ts # Generate attributes
│               └── rag-chain.ts        # RAG implementation
