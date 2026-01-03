import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Volume2, VolumeX, Send, Loader, Zap, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface GoogleGenerativeAI {
  getGenerativeModel: (config: { model: string }) => {
    startChat: (config: { history: Array<{ role: string; parts: Array<{ text: string }> }> }) => {
      sendMessage: (message: string) => Promise<{ response: { text: () => string } }>;
    };
  };
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_API_KEY || "");
  const [showApiInput, setShowApiInput] = useState(!import.meta.env.VITE_GOOGLE_API_KEY);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const genAI = useRef<GoogleGenerativeAI | null>(null);

  // Auto-initialize if API key is in environment
  useEffect(() => {
    if (import.meta.env.VITE_GOOGLE_API_KEY && !showApiInput) {
      initializeAI(import.meta.env.VITE_GOOGLE_API_KEY);
    }
  }, []);

  // Auto-scroll to latest message
  const scrollToBottom = () => {  
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format AI response to be more user-friendly with bullet points
  const formatAIResponse = (text: string): string => {
    // Add system prompt to ensure better formatting
    const systemPrompt = `Please format your response in a clear, user-friendly way with:
- Use bullet points (•) for lists
- Keep explanations concise and easy to understand
- Break down complex topics into simple points
- Use numbered steps (1., 2., 3.) for sequential instructions
- Use headers with ** for main topics
- Add line breaks between sections for readability

User question: `;
    return systemPrompt + text;
  };

  // Parse and render formatted text with proper styling
  const renderFormattedText = (text: string) => {
    // Split by line breaks
    const lines = text.split('\n').filter(line => line.trim());
    
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          
          // Check for headers (text between **)
          if (trimmedLine.includes('**')) {
            const headerText = trimmedLine.replace(/\*\*/g, '');
            return (
              <h4 key={index} className="font-bold text-base mt-3 mb-1">
                {headerText}
              </h4>
            );
          }
          
          // Check for numbered lists (1., 2., etc.)
          if (/^\d+\./.test(trimmedLine)) {
            return (
              <div key={index} className="flex gap-2 ml-2">
                <span className="font-bold text-accent min-w-[24px]">
                  {trimmedLine.match(/^\d+\./)?.[0]}
                </span>
                <span>{trimmedLine.replace(/^\d+\.\s*/, '')}</span>
              </div>
            );
          }
          
          // Check for bullet points (•, -, *, or starting with bullet)
          if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
            return (
              <div key={index} className="flex gap-2 ml-2">
                <span className="text-accent font-bold mt-1">•</span>
                <span>{trimmedLine.replace(/^[•\-*]\s*/, '')}</span>
              </div>
            );
          }
          
          // Regular paragraph
          if (trimmedLine.length > 0) {
            return (
              <p key={index} className="leading-relaxed">
                {trimmedLine}
              </p>
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  const initializeAI = async (key: string) => {
    if (key.trim()) {
      try {
        console.log("Initializing AI with API key...");
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        genAI.current = new GoogleGenerativeAI(key);
        setShowApiInput(false);
        // Add welcome message with better formatting
        addMessage(`**Welcome to PowerGrid AI Assistant!** 🎉

I'm here to help you with:

• **Material Forecasting** - Predict future material demands
• **Inventory Management** - Track and optimize stock levels  
• **Power Grid Optimization** - Enhance grid performance
• **Budget Analysis** - Monitor and plan expenses
• **Project Insights** - Get detailed project analytics

**How can I assist you today?** Just type your question below!`, 'ai');
      } catch (error) {
        console.error("Failed to initialize AI:", error);
        addMessage("Failed to initialize AI. Please check your API key and try again.", 'ai');
        setShowApiInput(true);
      }
    }
  };

  const addMessage = (text: string, sender: 'user' | 'ai') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !genAI.current) return;

    const userMessage = inputValue;
    
    // Add user message
    addMessage(userMessage, 'user');
    setInputValue("");
    setIsLoading(true);

    try {
      const model = genAI.current.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      // Build conversation history for context (excluding welcome message)
      const conversationHistory = messages
        .filter(msg => !msg.text.includes("Welcome to PowerGrid"))
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

      const chat = model.startChat({ 
        history: conversationHistory
      }); 
      
      // Enhanced prompt for better formatting
      const enhancedPrompt = `You are a PowerGrid AI Assistant specialized in material forecasting, inventory management, and power grid optimization.

Format your response in a clear, user-friendly way:
- Use bullet points (•) for listing multiple items
- Use numbered steps (1., 2., 3.) for sequential instructions
- Keep explanations concise and easy to understand
- Use **headers** for main topics
- Add blank lines between sections
- Break down complex topics into simple, digestible points

User question: ${userMessage}`;
      
      const result = await chat.sendMessage(enhancedPrompt);
      
      // Handle the response - it might be a string or have different structure
      let aiResponse = '';
      if (typeof result.response.text === 'function') {
        aiResponse = result.response.text();
      } else if (typeof result.response.text === 'string') {
        aiResponse = result.response.text;
      } else {
        aiResponse = String(result.response.text);
      }
      
      if (aiResponse && aiResponse.trim()) {
        addMessage(aiResponse, 'ai');
      } else {
        addMessage("I received an empty response. Please try again.", 'ai');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        errorMessage += ` Error: ${error.message}`;
      }
      addMessage(errorMessage, 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const playVoice = () => {
    if (messages.length === 0) return;
    
    setIsPlaying(true);
    const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
    if (lastAiMessage) {
      const utterance = new SpeechSynthesisUtterance(lastAiMessage.text);
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const stopVoice = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">Voice-enabled intelligent support powered by Google Generative AI</p>
        </div>

        {showApiInput && (
          <Card className="border-accent/30 bg-gradient-to-br from-accent/10 via-background to-accent/5 
            shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <CardHeader className="border-b border-accent/20">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Zap className="h-6 w-6 text-accent animate-pulse" />
                </div>
                <div>
                  <span className="text-xl">Initialize AI Assistant</span>
                  <p className="text-xs text-muted-foreground font-normal mt-1">
                    Connect to Google Gemini AI
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                <p className="text-sm text-foreground mb-2 font-medium">
                  🚀 Get Started in 2 Easy Steps:
                </p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>1. Get your free API key from{' '}
                    <a 
                      href="https://ai.google.dev/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-accent hover:underline font-medium"
                    >
                      ai.google.dev
                    </a>
                  </li>
                  <li>2. Paste it below and click Initialize</li>
                </ol>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="🔑 Paste your Google API Key here..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      initializeAI(apiKey);
                    }
                  }}
                  className="h-12 text-base border-2 border-accent/20 focus:border-accent rounded-xl
                    transition-all duration-300"
                />
                <Button 
                  onClick={() => initializeAI(apiKey)} 
                  disabled={!apiKey.trim() || isLoading}
                  size="lg"
                  className="px-6 gap-2 rounded-xl bg-gradient-to-r from-accent to-accent/80 
                    hover:from-accent/90 hover:to-accent/70 transition-all duration-300
                    disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {isLoading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <Zap className="h-5 w-5" />
                  )}
                  Initialize
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                🔒 Your API key is stored securely in your browser
              </p>
            </CardContent>
          </Card>
        )}

        {!showApiInput && (
          <>
            <Card className="border-accent/30 bg-gradient-to-br from-background via-accent/5 to-background 
              flex flex-col h-[600px] shadow-2xl backdrop-blur-sm">
              <CardHeader className="flex-shrink-0 border-b border-border/50 bg-gradient-to-r from-accent/10 to-transparent">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <MessageSquare className="h-6 w-6 text-accent" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse"></span>
                    </div>
                    <div>
                      <span className="text-lg">PowerGrid AI Assistant</span>
                      <p className="text-xs text-muted-foreground font-normal">
                        Powered by Google Gemini • Online
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full font-normal">
                      {messages.length} messages
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4 mb-4 p-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="relative">
                      <Bot className="h-16 w-16 text-accent animate-pulse" />
                      <Sparkles className="h-6 w-6 text-accent absolute -top-1 -right-1 animate-bounce" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground mb-2">
                        Welcome to PowerGrid AI Assistant! 👋
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Ask me anything about material forecasting, inventory management, 
                        power grid optimization, or any project-related queries.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} 
                        animate-in slide-in-from-bottom-4 duration-500`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* AI Avatar */}
                      {message.sender === 'ai' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/60 
                          flex items-center justify-center shadow-lg">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      )}
                      
                      {/* Message Content */}
                      <div
                        className={`max-w-xs lg:max-w-2xl px-5 py-3 rounded-2xl shadow-md
                          transition-all duration-300 hover:shadow-lg ${
                          message.sender === 'user'
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-none'
                            : 'bg-gradient-to-br from-muted to-muted/80 text-foreground rounded-bl-none border border-border'
                        }`}
                      >
                        {message.sender === 'ai' ? (
                          <div className="text-sm leading-relaxed">
                            {renderFormattedText(message.text)}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{message.text}</p>
                        )}
                        <p className="text-xs opacity-60 mt-2">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* User Avatar */}
                      {message.sender === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 
                          flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/60 
                      flex items-center justify-center shadow-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-gradient-to-br from-muted to-muted/80 text-foreground px-5 py-3 rounded-2xl 
                      rounded-bl-none flex items-center gap-3 border border-border shadow-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm text-muted-foreground">AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
            </Card>

            {/* Voice Controls */}
            <div className="flex gap-3 justify-center items-center">
              <Button 
                size="lg" 
                onClick={playVoice}
                disabled={isPlaying || messages.length === 0}
                variant="outline"
                className="gap-2 rounded-xl border-2 border-accent/30 hover:border-accent 
                  hover:bg-accent/10 transition-all duration-300 transform hover:scale-105
                  disabled:opacity-50 disabled:hover:scale-100"
              >
                <Volume2 className="h-5 w-5" />
                <span className="hidden sm:inline">Play Voice</span>
              </Button>
              {isPlaying && (
                <Button 
                  size="lg" 
                  variant="destructive"
                  onClick={stopVoice}
                  className="gap-2 rounded-xl animate-pulse shadow-lg transform hover:scale-105
                    active:scale-95 transition-all duration-200"
                >
                  <VolumeX className="h-5 w-5" />
                  <span className="hidden sm:inline">Stop</span>
                </Button>
              )}
              {messages.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {isPlaying ? '🔊 Playing last AI response...' : '🎧 Voice-enabled'}
                </span>
              )}
            </div>

            {/* Input Area */}
            <Card className="border-accent/30 shadow-xl bg-gradient-to-br from-background to-accent/5">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="💡 Ask about material forecasting, inventory, or power grid optimization..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="h-12 text-base pr-4 pl-4 border-2 border-accent/20 focus:border-accent 
                        transition-all duration-300 rounded-xl bg-background/50 backdrop-blur-sm
                        placeholder:text-muted-foreground/70"
                    />
                    {inputValue && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {inputValue.length} chars
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    size="lg"
                    className="gap-2 px-6 rounded-xl bg-gradient-to-r from-accent to-accent/80 
                      hover:from-accent/90 hover:to-accent/70 transition-all duration-300
                      disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl
                      transform hover:scale-105 active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span className="hidden sm:inline">Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Quick suggestion chips */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs text-muted-foreground">Quick questions:</span>
                  {['Material forecast', 'Inventory status', 'Project insights', 'Budget analysis'].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setInputValue(`Tell me about ${chip.toLowerCase()}`)}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20
                        hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
