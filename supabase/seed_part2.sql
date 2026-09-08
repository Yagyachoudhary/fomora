insert into launches
  (url, name, source, category, description, pricing, license, runs_locally, languages, free_alternative_to, hardware_note, velocity, signal_badge, base_momentum)
values
('https://huggingface.co/black-forest-labs/FLUX.1-schnell', 'FLUX.1 [schnell]', 'Black Forest Labs', 'Image AI',
 'High-quality image generation under Apache 2.0 — commercial use permitted.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'Midjourney, DALL-E', 'Around 12GB VRAM, quantised versions run lighter', 'Exploding', 'Paradigm Shift', 93),

('https://huggingface.co/black-forest-labs/FLUX.1-dev', 'FLUX.1 [dev]', 'Black Forest Labs', 'Image AI',
 'Higher quality than schnell but licensed for non-commercial use only.',
 'open-source', 'Non-commercial', true, ARRAY['English'], 'Midjourney', 'Around 24GB VRAM', 'Exploding', 'High Signal', 89),

('https://huggingface.co/stabilityai/stable-diffusion-3.5-large', 'Stable Diffusion 3.5', 'Stability AI', 'Image AI',
 'Anchors the largest open image ecosystem — LoRAs, ControlNets, tooling.',
 'open-source', 'Community licence', true, ARRAY['English'], 'Midjourney, Adobe Firefly', 'Varies by variant', 'Steady', 'High Signal', 85),

('https://huggingface.co/Kwai-Kolors/Kolors', 'Kolors', 'Kuaishou', 'Image AI',
 'Handles non-English prompts well, where most image models are English-centric.',
 'open-source', 'Open weights', true, ARRAY['Chinese','English'], 'Midjourney', 'GPU required', 'Steady', 'Emerging', 70),

('https://github.com/comfyanonymous/ComfyUI', 'ComfyUI', 'Community', 'Design Tools',
 'Node-based interface for running open image and video models locally.',
 'open-source', 'GPL-3.0', true, ARRAY['English'], 'Midjourney web app', 'Depends on the model you load', 'Exploding', 'High Signal', 87),

('https://github.com/lllyasviel/Fooocus', 'Fooocus', 'Community', 'Design Tools',
 'The simplest way to run local image generation — almost no settings to learn.',
 'open-source', 'GPL-3.0', true, ARRAY['English'], 'Midjourney', 'Around 8GB VRAM', 'Steady', 'High Signal', 76),

('https://drawthings.ai', 'Draw Things', 'Draw Things', 'Design Tools',
 'Free local image generation on Mac and iPhone, no setup required.',
 'free', 'Proprietary (free)', true, ARRAY['English'], 'Midjourney mobile', 'Runs on Apple Silicon', 'Steady', 'Emerging', 68),

('https://ollama.com', 'Ollama', 'Ollama', 'AI Infra',
 'One command to run open LLMs locally. The easiest on-ramp there is.',
 'open-source', 'MIT', true, ARRAY['Multilingual'], 'ChatGPT Plus, Claude Pro', 'Works on laptops; bigger models need more RAM', 'Exploding', 'Paradigm Shift', 91),

('https://lmstudio.ai', 'LM Studio', 'LM Studio', 'AI Infra',
 'Desktop app for downloading and chatting with open models offline.',
 'free', 'Proprietary (free)', true, ARRAY['Multilingual'], 'ChatGPT Plus', 'Mac, Windows, Linux', 'Steady', 'High Signal', 80),

('https://huggingface.co/Qwen', 'Qwen (open models)', 'Alibaba', 'Open Source AI',
 'Broad open model family covering chat, coding, vision and audio.',
 'open-source', 'Apache-2.0 (most)', true, ARRAY['Multilingual','Chinese','English'], 'ChatGPT, Claude', 'Sizes from tiny to very large', 'Exploding', 'Paradigm Shift', 92)
on conflict (url) do update set
  pricing = excluded.pricing,
  license = excluded.license,
  runs_locally = excluded.runs_locally,
  languages = excluded.languages,
  free_alternative_to = excluded.free_alternative_to,
  hardware_note = excluded.hardware_note;
