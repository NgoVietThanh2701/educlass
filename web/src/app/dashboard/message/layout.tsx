import { ChatSocketProvider } from "@/features/chat/providers/socket-provider";

export default function MessageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatSocketProvider>{children}</ChatSocketProvider>;
}
