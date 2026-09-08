insert into launches
  (url, name, source, category, description, pricing, license, runs_locally, languages, free_alternative_to, hardware_note, velocity, signal_badge, base_momentum)
values
('https://huggingface.co/facebook/musicgen-large', 'MusicGen', 'Meta', 'Music & Audio AI',
 'Text-to-music generation with open weights and permissive tooling.',
 'open-source', 'CC-BY-NC', true, ARRAY['English'], 'Suno, Udio', 'GPU recommended', 'Steady', 'Emerging', 68),

('https://huggingface.co/stabilityai/stable-audio-open-1.0', 'Stable Audio Open', 'Stability AI', 'Music & Audio AI',
 'Generates sound effects and short audio samples locally.',
 'open-source', 'Community licence', true, ARRAY['English'], 'Soundraw, Epidemic Sound', 'GPU recommended', 'Steady', 'Emerging', 65),

('https://huggingface.co/Lightricks/LTX-Video', 'LTX-Video', 'Lightricks', 'Video AI',
 'Fast open video generation that runs on consumer GPUs.',
 'open-source', 'Open weights', true, ARRAY['English'], 'Runway, Sora', 'Around 12GB VRAM', 'Heating up', 'High Signal', 78),

('https://huggingface.co/genmo/mochi-1-preview', 'Mochi 1', 'Genmo', 'Video AI',
 'Open video generation model with permissive licensing.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'Runway Gen-4', 'High VRAM needed', 'Steady', 'Emerging', 70),

('https://github.com/continuedev/continue', 'Continue.dev', 'Continue', 'AI Coding',
 'Open-source coding assistant for VS Code and JetBrains; bring your own model.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'GitHub Copilot ($10/mo)', 'Runs against local or hosted models', 'Heating up', 'High Signal', 80),

('https://github.com/cline/cline', 'Cline', 'Cline', 'AI Coding',
 'Open agentic coding extension that can use local or hosted models.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'Cursor ($20/mo)', 'Depends on chosen model', 'Exploding', 'High Signal', 83),

('https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct', 'Qwen Coder', 'Alibaba', 'AI Coding',
 'Open coding model competitive with paid assistants on many tasks.',
 'open-source', 'Apache-2.0', true, ARRAY['English'], 'GitHub Copilot', 'Smaller sizes run locally', 'Steady', 'High Signal', 79)
on conflict (url) do update set
  pricing = excluded.pricing,
  license = excluded.license,
  runs_locally = excluded.runs_locally,
  languages = excluded.languages,
  free_alternative_to = excluded.free_alternative_to,
  hardware_note = excluded.hardware_note;
