// Centralized notification helpers using console methods instead of window.alert/confirm/prompt
// For modal dialogs, use ConfirmModal and PromptModal components directly

export const notify = {
  info(message: string) {
    console.log(`[INFO] ${message}`);
  },
  error(message: string) {
    console.error(`[ERROR] ${message}`);
  },
  success(message: string) {
    console.log(`[SUCCESS] ${message}`);
  },
  warn(message: string) {
    console.warn(`[WARN] ${message}`);
  },
  // Note: For confirm and prompt, use the ConfirmModal and PromptModal components directly
  // These methods are kept for backward compatibility but log to console
  confirm(_message: string): Promise<boolean> {
    console.log(`[CONFIRM] ${_message} - Use ConfirmModal component instead`);
    return Promise.resolve(true);
  },
  prompt(_message: string, _defaultValue?: string): Promise<string | null> {
    console.log(`[PROMPT] ${_message} - Use PromptModal component instead`);
    return Promise.resolve(null);
  },
};
