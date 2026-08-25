import React, { useState, useEffect } from "react";

import Input from "../../Input";
import { Select, Tooltip, UploadFile } from "antd";
import styles from "./index.module.scss";
import { useFileList } from "./_hooks";
import {
  FileList,
  AgentToggleButton,
  SendButton,
  StopButton,
  UploadButton,
  AgentToggleConfig,
} from "./_components";
import classNames from "classnames";
import Button, { ButtonProps } from "../../Button";
export type { AgentToggleConfig } from "./_components";

export interface AgentConfig {
  key: string;
  open: boolean;
}

export interface ModelConfig {
  label: string;
  value: string;
  /**
   * List of feature keys supported by this model, used to filter which features from agents are displayed
   * If not set, all agents are displayed
   */
  agents: AgentConfig[];
  /**
   * Whether this model's answers include a thinking section
   * If false, thinking content is not processed or displayed
   */
  hasThinking?: boolean;
  [key: string]: unknown;
}

export interface UploadConfig {
  action?: string;
  accept?: string;
  size?: number;
  data?: Record<string, string>;
}

export interface ChatInputProps {
  onSend?: (value: string) => void;
  assistanting?: boolean;
  onStop?: () => void;
  onFileListChange?: (fileList: UploadFile[]) => void;
  fileList?: UploadFile[];
  modelConfig?: {
    modelList: ModelConfig[];
    modelType: string;
    setModelType: (value: string) => void;
  };
  agents?: AgentToggleConfig[];
  /** agents state, used for controlled mode */
  agentsState?: AgentConfig[];
  onAgentsChange?: (agents: AgentConfig[]) => void;
  placeholder?: string;
  sendIcon?: string;
  stopIcon?: string;
  uploadConfig?: UploadConfig;
  wrapperClassName?: string;
  onFileInterceptClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  buttonGroup?: ButtonProps[];
  uploadEnabled?: boolean;
  /**
   * Disable sending. The send button turns disabled and Enter no longer submits;
   * the textarea stays editable so a half-typed message is never lost.
   *
   * The component already disables the send button during its own uploads
   * (`isUpload`), but consumers that run their own upload flow
   * (`uploadEnabled={false}`) had no way in: they could only intercept `onSend`
   * and pop a warning, leaving the button looking perfectly clickable.
   */
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = (props) => {
  const {
    onSend,
    assistanting,
    onStop,
    onFileListChange,
    fileList: _fileList = [],
    modelConfig,
    agents = [],
    agentsState: externalAgentsState,
    onAgentsChange,
    placeholder = "询问问题",
    sendIcon,
    stopIcon,
    uploadConfig,
    wrapperClassName,
    onFileInterceptClick,
    buttonGroup,
    uploadEnabled = true,
    disabled = false,
  } = props;

  const [value, setValue] = useState<string>("");
  const [isUpload, setIsUpload] = useState<boolean>(false);
  const { fileList, setFileList } = useFileList(_fileList);

  // Manage the internal state of agents (uncontrolled mode)
  const [internalAgentsState, setInternalAgentsState] = useState<AgentConfig[]>(
    () => {
      // Initialize state: prefer the current model's agents; otherwise derive from the passed-in agents config, with open defaulting to true
      const currentModel = modelConfig?.modelList.find(
        (m) => m.value === modelConfig?.modelType
      );
      if (currentModel?.agents && currentModel.agents.length > 0) {
        return currentModel.agents;
      }
      return agents?.map((config) => ({
        key: config.key,
        open: true,
      }));
    }
  );

  // Determine whether in controlled mode
  const isControlled = externalAgentsState !== undefined;
  // Use external state or internal state
  const agentsState = isControlled ? externalAgentsState : internalAgentsState;

  // When the model switches, sync the agents state (only in uncontrolled mode)
  useEffect(() => {
    if (isControlled) return; // In controlled mode, state is managed externally

    const currentModel = modelConfig?.modelList.find(
      (m) => m.value === modelConfig?.modelType
    );
    if (currentModel?.agents && currentModel.agents.length > 0) {
      setInternalAgentsState(currentModel.agents);
      onAgentsChange?.(currentModel.agents);
    }
  }, [
    modelConfig?.modelType,
    modelConfig?.modelList,
    onAgentsChange,
    isControlled,
  ]);

  // Based on the currently selected model, filter the feature configs supported by that model
  const currentModel = modelConfig?.modelList.find(
    (m) => m.value === modelConfig?.modelType
  );
  const availableFeatureConfigs = currentModel?.agents
    ? agents.filter((config) =>
        currentModel.agents.some((agent) => agent.key === config.key)
      )
    : agents;

  // Handle agent state toggling
  const handleAgentToggle = (key: string) => {
    const newAgentsState = agentsState?.map((agent) =>
      agent.key === key ? { ...agent, open: !agent.open } : agent
    );

    // Controlled mode: only notify externally; the external side updates the state
    // Uncontrolled mode: update internal state
    if (!isControlled) {
      setInternalAgentsState(newAgentsState);
    }
    onAgentsChange?.(newAgentsState);
  };

  // Get the active state of an agent
  const getAgentActive = (key: string): boolean => {
    return agentsState.find((agent) => agent.key === key)?.open ?? false;
  };

  // Handle file removal from the file list
  const handleFileRemove = (uid: string) => {
    const newFileList = fileList.filter((v) => v.uid !== uid);
    setFileList(newFileList);
    onFileListChange?.(newFileList);
  };

  // Handle file list changes
  const handleFileListChange = (newFileList: UploadFile[]) => {
    setFileList(newFileList);
    onFileListChange?.(newFileList);
  };

  // Handle sending
  const handleSend = () => {
    if (disabled) {
      return;
    }
    if (value.trim() !== "") {
      setValue("");
      onSend?.(value);
    }
  };

  // Handle the Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !assistanting &&
      value.trim() !== ""
    ) {
      e.preventDefault();
      handleSend();
    }
  };

  // Merge the upload config
  const mergedUploadConfig: UploadConfig = {
    action: uploadConfig?.action,
    accept: uploadConfig?.accept,
    size: uploadConfig?.size ?? 20,
    data: uploadConfig?.data,
  };

  return (
    <div className={classNames(styles.ChatInputWrapper, wrapperClassName)}>
      <div className={styles.ChatInput}>
        <FileList fileList={fileList} onRemove={handleFileRemove} />
        <Input.TextArea
          autoSize={{ minRows: 3, maxRows: 5 }}
          className={styles.textArea}
          placeholder={placeholder}
          onChange={(v) => {
            if (v.trim() === "") {
              setValue("");
            } else {
              setValue(v);
            }
          }}
          value={value}
          onKeyDown={handleKeyDown}
        />
        <ul className={styles.tool}>
          <ul>
            {modelConfig && (
              <li>
                <Select
                  options={modelConfig?.modelList}
                  value={modelConfig?.modelType}
                  className={styles.select}
                  allowClear={false}
                  onChange={(v) => {
                    modelConfig?.setModelType?.(v);
                  }}
                />
              </li>
            )}
            {availableFeatureConfigs?.map((config) => (
              <AgentToggleButton
                key={config.key}
                config={config}
                active={getAgentActive(config.key)}
                onClick={() => handleAgentToggle(config.key)}
              />
            ))}
          </ul>
          {buttonGroup?.map((button: ButtonProps, idx: number) => (
            // key must be set on the outermost element returned by map (Tooltip);
            // setting it on the inner Button is not seen by React and triggers a "missing key" warning
            <Tooltip key={idx} title={button.title}>
              <Button
                {...button}
                title=""
                className={classNames(styles.button, button.className)}
              />
            </Tooltip>
          ))}
          {uploadEnabled && (
            <UploadButton
              onFileListChange={handleFileListChange}
              fileList={fileList}
              uploadConfig={mergedUploadConfig}
              onUploadingChange={setIsUpload}
              onInterceptClick={onFileInterceptClick}
            />
          )}
          <>
            {assistanting ? (
              <StopButton onStop={onStop || (() => {})} stopIcon={stopIcon} />
            ) : (
              <SendButton
                value={value}
                onSend={handleSend}
                sendIcon={sendIcon}
                disabled={isUpload || disabled}
              />
            )}
          </>
        </ul>
      </div>
    </div>
  );
};

export default ChatInput;
