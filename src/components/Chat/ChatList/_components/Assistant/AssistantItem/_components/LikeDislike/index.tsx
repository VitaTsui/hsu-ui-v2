import React, { useEffect, useState } from "react";
import Icon from "../../../../../../../Icon";
import Form from "../../../../../../../Form";
import styles from "./index.module.scss";

interface LikeDislikeProps {
  messageId?: string;
  initialLike?: boolean | null;
  onLikeChange?: (
    messageId: string,
    like: boolean | null,
    content: string
  ) => void;
}

const LikeDislike: React.FC<LikeDislikeProps> = ({
  messageId,
  initialLike,
  onLikeChange,
}) => {
  const [like, setLike] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<boolean>(false);

  useEffect(() => {
    setLike(initialLike ?? null);
  }, [initialLike]);

  if (!onLikeChange) {
    return null;
  }

  return (
    <>
      <div className={styles.like}>
        <div
          className={styles.likeItem}
          onClick={() => {
            setLike(like === true ? null : true);

            if (messageId) {
              onLikeChange?.(messageId, like === true ? null : true, "");
            }
          }}
        >
          <Icon
            icon={`iconamoon:like-${like === true ? "fill" : "light"}`}
            className={styles.likeIcon}
          />
        </div>
        <div
          className={styles.likeItem}
          onClick={() => {
            if (like === false) {
              setLike(null);

              if (messageId) {
                onLikeChange?.(messageId, null, "");
              }
            } else {
              setFeedback(true);
            }
          }}
        >
          <Icon
            icon={`iconamoon:dislike-${like === false ? "fill" : "light"}`}
            className={styles.likeIcon}
          />
        </div>
      </div>

      <Form.Modal
        title="反馈"
        open={feedback}
        centered
        className={styles.formModal}
        onCancel={() => setFeedback(false)}
        onOk={(data, form) => {
          setFeedback(false);
          setLike(false);

          if (messageId) {
            onLikeChange?.(messageId, false, (data.content as string) || "");
          }

          form.resetFields();
        }}
        width={"40%"}
        mask={{ closable: false }}
        formItems={[
          {
            type: "TEXTAREA",
            name: "content",
            componentProps: {
              rows: 10,
            },
          },
        ]}
      />
    </>
  );
};

export default LikeDislike;

