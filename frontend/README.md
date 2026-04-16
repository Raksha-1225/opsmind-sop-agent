
Project: Enterprise SOP Agent
introduction:a RAG-based agent for querying corporate Standard Operating Procedures (SOPs) from PDFs, 
providing accurate answers with source citations to avoid hallucinations.

AIM:
  --> RAG pipeline: Chunks PDFs, generates embeddings, stores/retrieves relevant context from MongoDB.
  -->Admin dashboard: Upload/delete SOP PDFs, auto-reindex embeddings.

 
SaaS (Software as a Service) tools" are cloud-based applications accessed via web browsers,
offering scalable, subscription-based solutions for business tasks like CRM, accounting, and collaboration.

  ->we uses MongoDB Atlas Vector Search for embeddings,
  -> LangChain.js for orchestration,
  ->Gemini 1.5 Flash as the LLM,
  -> and React with Server-Sent Events (SSE) for streaming responses.

Retrieval-Augmented Generation (RAG) with MongoDB:
It is a architecture used to augment large language models (LLMs) with additional data so that they can generate more accurate responses.

Why use RAG?
When working with LLMs, you might encounter the following limitations:

#Stale data: LLMs are trained on a static dataset up to a certain point in time. This means that they have a limited knowledge base and might use outdated data.

#No access to additional data: LLMs don't have access to local, personalized, or domain-specific data. Therefore, they can lack knowledge about specific domains.

#Hallucinations: When grounded in incomplete or outdated data, LLMs can generate inaccurate responses.

Steps to implement RAG:

#Ingestion: Store your custom data as vector embeddings in a vector database, such as MongoDB. This allows you to create a knowledge base of up-to-date and personalized data.

#Retrieval: Retrieve semantically similar documents from the database based on the user's question by using a search solution, such as MongoDB Vector Search. These documents augment the LLM with additional, relevant data.

#Generation: Prompt the LLM. The LLM uses the retrieved documents as context to generate a more accurate and relevant response, reducing hallucinations.

RAG with MongoDB Vector Search:

To create a basic ingestion pipeline with MongoDB as the vector database, do the following:

->Prepare your data:Load, process, and chunk, your data to prepare it for your RAG application. Chunking involves splitting your data into smaller parts for optimal retrieval.

->Convert the data to vector embeddings:Convert your data into vector embeddings by using an embedding model. To learn more, see How to Create Vector Embeddings Manually.

->Store the data and embeddings in MongoDB: Store these embeddings in your cluster. You store embeddings as a field alongside other data in your collection.
 ->To retrieve relevant documents with MongoDB Vector Search, you convert the user's question into vector embeddings and run a vector search query against the data in your MongoDB collection to find documents with the most similar embeddings.

To perform basic retrieval with MongoDB Vector Search, do the following:

#Define an MongoDB Vector Search index on the collection that contains your vector embeddings.

Choose one of the following methods to retrieve documents based on the user's question:

#Use an MongoDB Vector Search integration with a popular framework or service. These integrations include built-in libraries and tools that enable you to easily build retrieval systems
with MongoDB Vector Search.

#Generation
To generate responses, combine your retrieval system with an LLM. After you perform a vector search to retrieve relevant documents, you provide the user's question along with the relevant documents
as context to the LLM so that it can generate a more accurate response.

Choose one of the following methods to connect to an LLM:

#Use an MongoDB Vector Search integration with a popular framework or service. These integrations include built-in libraries and tools to help you connect to LLMs 
with minimal set-up.

#Call the LLM's API. Most AI providers offer APIs to their generative models that you can use to generate responses.

#Load an open-source LLM. If you don't have API keys or credits, you can use an open-source LLM by loading it locally from your application.


Create a Vector Search Index

#An index: is a data structure that holds a subset of data from a collection's documents that improves database performance for specific queries

#A vector search index: points to the fields that contain your vector embeddings and includes the dimensions of your vectors as well as the function used to measure similarity between vectors of queries and vectors stored in the database.
Set up your Atlas cluster.

Create a free Atlas account or sign in to an existing account.

If you don't yet have an Atlas cluster, create a free M0 cluster. To learn more about creating an Atlas cluster, see Create a Cluster.

IMPORTANT: If you are working with an existing cluster, you must have Project Data Access Admin or higher access to your Atlas project.

If you create a new cluster, you have the necessary permissions by default.

You can create only one M0 Free cluster per project.

If you haven't yet loaded the sample dataset for this quick start onto your cluster, load the sample_mflix sample database onto your cluster.

If you already loaded the sample_mflix dataset, check that the sample_mflix database contains the embedded_movies collection.
If it doesn't, drop the sample_mflix database and reload the sample_mflix dataset.

Loading the sample dataset can take several minutes to complete.

 ->1Choose your cluster from the Select data source menu and click Go to Atlas Search.

 ->2Create a Vector Search index.

  Create the index.
  python vector-index.py
  
  Run a Vector Search Query
  Construct your vector search query.
  Create a file named atlas-vector-search-quick-start.py.
  
  Specify the <connectionString>.

  Replace <connection-string> with the connection string for your Atlas cluster or local Atlas deployment.
  ex:
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  
  Run your query.
  
  python atlas-vector-search-quick-start.py

----->MongoDB Atlas Vector Search:<-----

    Procedure
1Set up the environment.

pip install --quiet --upgrade pymongo voyageai openai langchain langchain_community pypdf

Create an interactive Python notebook by saving a file with the .ipynb extension. This notebook allows you to run Python code snippets individually. 


 setup frontend project:
  
  steps1:create empty folder
  steps2:open with vs code editor
  steps3:open terminal
  ssteps4:press command: npm create vite@latest project-name
  steps5:to run project press command ( npm run dev )

  install packages:
 ex: npm i bootstrap
  npm i react-bootstrap
  npm i axios

for backend setup make sure you have installed node js

to create a backend folder of project use command:
s-1:create folder with name of sop-backend
s-2:open with vs code
s-3:open terminal and go to directory of folder and press below command  and enter to initiate backend project
s-4:npm init -y
s-5:install dependency
ex:1: npm i express                            //use for server setup
   2: npm install langchain @langchain/core    //to show graph based workflow and testing  LLM applications

description:
//1:tools designed for production-ready AI applications
//npm install langchain @langchain/core
//LangChain.js is open-source and can be used in various JavaScript environments, including Node.js, Cloudflare Workers, and modern frontend frameworks like Next.js and React.
//1.LangGraph:A low-level framework for building more complex, stateful agents and controllable workflows using a graph-based approach.
//2.LangSmith: A unified platform for debugging, testing, and monitoring LLM applications, offering deep visibility into agent execution paths and runtime metrics.

//LLM: Gemini 1.5 Flash is a lightweight, multimodal model from Google optimized for speed, efficiency, and high-volume tasks

database: MongoDB Atlas Vector Search

Add the PyMongo Driver as a dependency in your project:
  
  steps to set python environment in backend folder to make sure having 
  python,pip,dnspython
  s-1:install python by downloading msi file
  s-2: python --version
  s-2: pip --version
  s-3:  python -m ensurepip --upgrade
  s-4:python -m pip install --upgrade pip 
  s-5: python -m venv venv
  s-6:pip install pymongo
  s-7:npm i child_process
  s-8:nodemon

  Get Started with PyMongo
  PyMongo is a Python package that you can use to connect to and communicate with MongoDB.

  ->mkdir pymongo-quickstart
  ->cd pymongo-quickstart
  ->quickstart.py
  ->python3 -m venv venv //virtual environment activated
  ->python3 -m pip install pymongo
