export interface UIElement {
  type: string;
  title?: string;
  bind_to?: string;
  placeholder?: string;
  action?: string;
}

export interface Collection {
  name: string;
  schema: string;
}

export interface DataModel {
  [key: string]: any;
}

export interface PromptData {
  context: {
    project: string;
    description: string;
    agent_role: string;
    assume: {
      OS: string;
      browser: string;
      framework: string;
    };
  };
  requirements: {
    use: string[];
    ensure: string[];
    separate: string[];
  };
  ui_spec: {
    elements: UIElement[];
    layout: string;
    theme: string;
    responsive: boolean;
  };
  data_spec: {
    model: DataModel;
    storage: {
      type: string;
      collections: Collection[];
    };
  };
  behavior: {
    state_changes: string[];
    validation: string[];
    edge_cases: string[];
  };
  testing: {
    test_cases: string[];
    error_handling: string[];
    performance: string[];
  };
  generate: {
    artifacts: string[];
    explanation: boolean;
  };
}
