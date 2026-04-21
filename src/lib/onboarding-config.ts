// Onboarding configuration - all options and labels

export const COUNTRY_OPTIONS = [
  { value: 'united_kingdom', label: 'United Kingdom' },
  { value: 'ireland', label: 'Ireland' },
  { value: 'united_states', label: 'United States' },
  { value: 'canada', label: 'Canada' },
  { value: 'australia', label: 'Australia' },
  { value: 'new_zealand', label: 'New Zealand' },
  { value: 'germany', label: 'Germany' },
  { value: 'france', label: 'France' },
  { value: 'netherlands', label: 'Netherlands' },
  { value: 'spain', label: 'Spain' },
  { value: 'italy', label: 'Italy' },
  { value: 'other', label: 'Other' },
] as const;

export const RELATIONSHIP_TYPE_OPTIONS = [
  {
    value: 'married',
    label: 'Married',
    description: 'Legally married',
  },
  {
    value: 'international_marriage',
    label: 'International Marriage',
    description: 'Married in a different country',
  },
  {
    value: 'common_law',
    label: 'Common-law Partnership',
    description: 'Living together without legal marriage',
  },
  {
    value: 'divorced',
    label: 'Already Divorced',
    description: 'Divorce is finalised',
  },
] as const;

export const STAGE_OPTIONS = [
  {
    value: 'thinking',
    label: 'Thinking about leaving',
    description: 'Considering your options',
  },
  {
    value: 'separated',
    label: 'Separated',
    description: 'Living apart, not yet divorced',
  },
  {
    value: 'in_court',
    label: 'In court proceedings',
    description: 'Going through legal divorce process',
  },
  {
    value: 'post_divorce',
    label: 'Post-divorce',
    description: 'Divorce finalised, rebuilding',
  },
] as const;

export const PRIORITY_OPTIONS = [
  {
    value: 'children',
    label: 'Children',
    description: 'Parenting arrangements and child welfare',
  },
  {
    value: 'finances',
    label: 'Finances',
    description: 'Budgeting, assets, and financial planning',
  },
  {
    value: 'housing',
    label: 'Housing',
    description: 'Living arrangements and property',
  },
  {
    value: 'emotional_support',
    label: 'Emotional Support',
    description: 'Mental health and wellbeing',
  },
  {
    value: 'legal_admin',
    label: 'Legal & Admin',
    description: 'Paperwork and legal organisation',
  },
] as const;

export const ONBOARDING_STEPS = [
  { id: 1, title: 'Location', question: 'Where do you currently live?' },
  { id: 2, title: 'Relationship', question: 'What is your relationship status?' },
  { id: 3, title: 'Stage', question: 'Where are you in the process?' },
  { id: 4, title: 'Priorities', question: 'What matters most to you right now?' },
  { id: 5, title: 'Children', question: 'Do you have children?' },
] as const;
