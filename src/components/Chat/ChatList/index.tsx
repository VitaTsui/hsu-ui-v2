import React, { ReactNode } from "react";
import styles from "./index.module.scss";
import User from "./_components/User";
import classNames from "classnames";
import Assistant from "./_components/Assistant";

export interface ChatMessage {
  query: QueryMessage;
  answers: AnswerMessage[];
  [key: string]: unknown;
}

export interface QueryMessage {
  query?: string;
  messageFiles?: {
    filename: string;
    url: string;
    id: string;
    [key: string]: unknown;
  }[];
  messageId?: string;
  time?: string;
  userName?: string;
}

export interface AnswerMessage {
  answer?: string;
  think_time?: number;
  think?: string;
  retrieverResources?: RetrieverResource[];
  messageId?: string;
  like?: boolean | null;
  runningTime?: number;
  time?: string;
  error?: string;
  assistantName?: string;
}

export interface RetrieverResource {
  position: number;
  datasetId: string;
  datasetName: string;
  documentId: string;
  documentName: string;
  dataSourceType: string;
  segmentId: string;
  retrieverFrom: string;
  score: number;
  hitCount: number;
  wordCount: number;
  segmentPosition: number;
  indexNodeHash: string;
  content: string;
  page: null;
  doc_metadata: null;
}

export interface ChatListProps {
  list?: ChatMessage[];
  className?: string;
  onAgain?: (query: string) => void;
  assistanting?: boolean;
  hideTool?: boolean;
  onLikeChange?: (
    messageId: string,
    like: boolean | null,
    content: string
  ) => void;
  defaultAnswer?: string;
  defaultAnswerClassName?: string;
  defaultAnswerItemClassName?: string;
  userClassName?: string;
  assistantClassName?: string;
  assistantItemClassName?: string;
  userName?: string;
  userAvatar?: ReactNode;
  assistantName?: string;
  assistantAvatar?: ReactNode;
  userRenderContent?: (
    originContent: ReactNode,
    item: QueryMessage
  ) => ReactNode;
  userRenderQuery?: (
    query: string | undefined,
    item: QueryMessage
  ) => string | undefined;
  userHeaderClassName?: string;
  assistantHeaderClassName?: string;
  noAnswerTip?: string;
}

const ChatList: React.FC<ChatListProps> = (props) => {
  const {
    list = [],
    className,
    onAgain,
    assistanting,
    onLikeChange,
    defaultAnswer,
    hideTool,
    defaultAnswerClassName,
    defaultAnswerItemClassName,
    userClassName,
    assistantClassName,
    assistantItemClassName,
    userName,
    userAvatar,
    assistantName,
    assistantAvatar,
    userRenderContent,
    userRenderQuery,
    userHeaderClassName,
    assistantHeaderClassName,
    noAnswerTip,
  } = props;

  return (
    <div className={classNames(styles.ChatList, className)}>
      {!!defaultAnswer && (
        <Assistant
          className={defaultAnswerClassName}
          itemClassName={defaultAnswerItemClassName}
          item={[
            {
              think: "",
              answer: defaultAnswer,
              retrieverResources: [],
              messageId: "1",
              think_time: 0,
              runningTime: 0,
              like: null,
            },
          ]}
          hideTool={true}
          assistantName={assistantName}
          assistantAvatar={assistantAvatar}
          headerClassName={assistantHeaderClassName}
          noAnswerTip={noAnswerTip}
        />
      )}
      {list?.map((item, idx) => {
        return (
          // Prefer the message id so a turn keeps its identity when the list grows; streaming
          // answers append to `list`, and an index-only key would make React re-key every
          // existing turn on each append.
          <React.Fragment key={item.query?.messageId ?? idx}>
            <User
              item={item.query}
              hideTool={hideTool}
              className={userClassName}
              userName={userName}
              userAvatar={userAvatar}
              renderContent={userRenderContent}
              renderQuery={userRenderQuery}
              headerClassName={userHeaderClassName}
            />
            {!!item?.answers?.length && (
              <Assistant
                className={assistantClassName}
                itemClassName={assistantItemClassName}
                item={item.answers}
                assistanting={idx === list.length - 1 && assistanting}
                onAgain={() => {
                  !!item.query?.query && onAgain?.(item.query?.query as string);
                }}
                hideTool={hideTool}
                onLikeChange={onLikeChange}
                isLast={idx === list.length - 1}
                assistantName={assistantName}
                assistantAvatar={assistantAvatar}
                headerClassName={assistantHeaderClassName}
                noAnswerTip={noAnswerTip}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ChatList;
