insert into launches
  (url, name, source, category, description, pricing, license, runs_locally, languages, free_alternative_to, hardware_note, velocity, signal_badge, base_momentum)
values
('https://huggingface.co/deepseek-ai', 'DeepSeek (open models)', 'DeepSeek', 'Open Source AI',
 'Strong open reasoning and coding models released with open weights.',
 'open-source', 'MIT (most)', true, ARRAY['Multilingual','Chinese','English'], 'ChatGPT Plus, Claude Pro', 'Large models need serious hardware', 'Exploding', 'Paradigm Shift', 90),

('https://huggingface.co/meta-llama', 'Llama (open models)', 'Meta', 'Open Source AI',
 'The family that made local LLMs mainstream; enormous tooling ecosystem.',
 'open-source', 'Llama licence', true, ARRAY['Multilingual'], 'ChatGPT Plus', 'Wide range of sizes', 'Steady', 'High Signal', 86),

('https://huggingface.co/google/gemma-3-27b-it', 'Gemma', 'Google', 'Open Source AI',
 'Compact open models tuned to run well on consumer hardware.',
 'open-source', 'Gemma licence', true, ARRAY['Multilingual'], 'ChatGPT Plus', 'Small sizes run on laptops', 'Steady', 'High Signal', 79),

('https://huggingface.co/mistralai', 'Mistral (open models)', 'Mistral AI', 'Open Source AI',
 'Efficient European open-weight models with permissive licensing.',
 'open-source', 'Apache-2.0 (most)', true, ARRAY['Multilingual','French','English'], 'ChatGPT Plus', 'Efficient at small sizes', 'Steady', 'High Signal', 81),

('https://huggingface.co/facebook/nllb-200-distilled-600M', 'NLLB-200', 'Meta', 'Writing AI',
 'Translation across 200 languages, including many with little coverage elsewhere.',
 'open-source', 'CC-BY-NC', true, ARRAY['200+ languages'], 'Google Translate API, DeepL', 'Distilled versions run on CPU', 'Steady', 'High Signal', 77),

('https://github.com/AI4Bharat/IndicTrans2', 'IndicTrans2', 'AI4Bharat', 'Writing AI',
 'Translation across 22 scheduled Indian languages, built specifically for Indic scripts.',
 'open-source', 'MIT', true, ARRAY['Hindi','Tamil','Telugu','Bengali','Marathi','Gujarati','Kannada','Malayalam','Punjabi','Odia','Assamese','Urdu'], 'Google Translate API', 'GPU recommended', 'Steady', 'High Signal', 75),

('https://ai4bharat.iitm.ac.in', 'AI4Bharat', 'IIT Madras', 'Open Source AI',
 'Open Indic-language models for speech, translation and text — free to use.',
 'open-source', 'MIT (most)', true, ARRAY['Hindi','Tamil','Telugu','Bengali','Marathi','Indic'], 'Paid Indic language APIs', 'Varies by model', 'Heating up', 'High Signal', 73),

('https://github.com/VikParuchuri/surya', 'Surya', 'Datalab', 'Data & Analytics',
 'OCR and layout detection across 90+ languages, strong on non-Latin scripts.',
 'open-source', 'GPL-3.0', true, ARRAY['90+ languages','Hindi','Devanagari'], 'Google Document AI, AWS Textract', 'GPU recommended', 'Heating up', 'High Signal', 74),

('https://github.com/PaddlePaddle/PaddleOCR', 'PaddleOCR', 'Baidu', 'Data & Analytics',
 'Mature multilingual OCR toolkit with lightweight mobile-ready models.',
 'open-source', 'Apache-2.0', true, ARRAY['Multilingual','Chinese','English'], 'AWS Textract', 'Runs on CPU', 'Steady', 'High Signal', 72),

('https://github.com/tesseract-ocr/tesseract', 'Tesseract', 'Community', 'Data & Analytics',
 'The long-standing open OCR engine, supporting 100+ languages.',
 'open-source', 'Apache-2.0', true, ARRAY['100+ languages'], 'Adobe Acrobat OCR', 'CPU only', 'Steady', 'Emerging', 63)
on conflict (url) do update set
  pricing = excluded.pricing,
  license = excluded.license,
  runs_locally = excluded.runs_locally,
  languages = excluded.languages,
  free_alternative_to = excluded.free_alternative_to,
  hardware_note = excluded.hardware_note;
