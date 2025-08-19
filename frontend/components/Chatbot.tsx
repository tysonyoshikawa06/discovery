import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Session } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatbotProps = {
  nodeId: string;
};

const Chatbot: React.FC<ChatbotProps> = ({ nodeId }) => {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { session } = useAuth();

  // handles scrolling to the bottom of the chat
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // saves user to db
  const saveChatsToDatabase = async (
    chatHistory: Message[],
    session: Session | null
  ) => {
    if (!session?.user?.id) return;

    const { error: upsertError } = await supabase
      .from("user_node_progress")
      .upsert(
        {
          user_id: session.user.id,
          node_id: nodeId,
          message_history: chatHistory,
        },
        { onConflict: "user_id,node_id" }
      );

    if (upsertError) {
      console.error("Error saving chat history:", upsertError);
      throw upsertError;
    } else {
      console.log("Chat history saved successfully.");
    }
  };

  // declares and calls function to fetch chat history from db on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        if (!session?.user?.id) return;

        const { data, error } = await supabase
          .from("user_node_progress")
          .select("message_history")
          .eq("user_id", session.user.id)
          .eq("node_id", nodeId)
          .maybeSingle();

        if (error) throw error;

        const messages = (data?.message_history as Message[]) || [];
        setChatHistory(messages);
      } catch (err) {
        console.error("Unexpected error: ", err);
      }
    };

    fetchChatHistory();
  }, [session, nodeId]);

  // prepares chat history and sends post request to backend; returns reply
  const sendMessage = async (messages: Message[]) => {
    // prepares and formats past 15 messages to send to api
    const formattedRecentMessages = messages.slice(-15).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    try {
      const response = await fetch("http://localhost:4000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedRecentMessages,
          nodeId: nodeId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong");

      return data.reply;
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setError("");
    setLoading(true);

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
    };

    // save chat history before setting to new state
    const nextHistory = [...chatHistory, userMessage];
    setChatHistory(nextHistory);

    const reply = await sendMessage(nextHistory);

    if (reply) {
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: reply,
      };

      // update chat history with assistant's
      const finalHistory = [...nextHistory, assistantMessage];
      setChatHistory(finalHistory);

      try {
        setInput("");
        setLoading(false);
        console.log("Saving chat history to database...");
        await saveChatsToDatabase(finalHistory, session);
      } catch (dbErr) {
        console.error("Failed to save chats:", dbErr);
      }
    }
  };

  return (
    <div>
      <h2>Val</h2>
      <div className="border border-1 w-full h-[20rem] overflow-y-auto p-2 space-y-2">
        {chatHistory.map((msg) => (
          <div key={msg.id}>
            <strong>{msg.role === "user" ? "You" : "Val"}:</strong>{" "}
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
        {loading && (
          <div>
            <em>Thinking...</em>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask a question..."
          className="border p-1 flex-1"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="border px-2"
        >
          Send
        </button>
      </form>

      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default Chatbot;
