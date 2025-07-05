import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatMessage {
	id?: number; // may be undefined until server assigns
	sender_id: number;
	message: string;
	timestamp?: string;
	role?: string;
	name?: string;
}

interface ChatPanelProps {
	proposalId: number;
	currentUserId: number;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ proposalId, currentUserId }) => {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [text, setText] = useState('');
	const wsRef = useRef<WebSocket | null>(null);
	const bottomRef = useRef<HTMLDivElement | null>(null);

	/* 🔄 Fetch chat history once */
	useEffect(() => {
		fetch(`/api/proposals/${proposalId}/chat`)
			.then((res) => res.json())
			.then(setMessages)
			.catch(console.error);
	}, [proposalId]);

	/* 🌐 Open WebSocket for realtime */
	useEffect(() => {
		const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
		const ws = new WebSocket(
			`${protocol}://${window.location.host}/ws/proposals/${proposalId}/chat`
		);

		ws.onmessage = (evt) => {
			const msg: ChatMessage = JSON.parse(evt.data);
			setMessages((prev) => [...prev, msg]);
		};

		wsRef.current = ws;
		return () => ws.close();
	}, [proposalId]);

	/* 📜 Auto‑scroll on new message */
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	/* 🚀 Send message helper */
	const send = async () => {
		if (!text.trim()) return;
		const payload = { sender_id: currentUserId, message: text };

		// REST save (persists + returns ID)
		await fetch(`/api/proposals/${proposalId}/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		}).catch(console.error);

		// WS broadcast for instant feedback
		wsRef.current?.send(JSON.stringify(payload));
		setText('');
	};

	return (
		<Card className='flex flex-col h-full rounded-2xl shadow-lg'>
			<CardHeader className='font-bold text-xl'>Team Chat</CardHeader>

			{/* 📨 Messages */}
			<CardContent className='flex-1 overflow-y-auto space-y-2 px-4'>
				{messages.map((msg, idx) => (
					<motion.div
						key={idx}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
					>
						<div
							className={`flex ${
								msg.sender_id === currentUserId
									? 'justify-end'
									: 'justify-start'
							}`}
						>
							<div className='max-w-xs bg-gray-100 dark:bg-gray-800 rounded-2xl p-2'>
								<p className='text-[11px] text-gray-600 dark:text-gray-400 mb-1'>
									[{msg.role?.toUpperCase() || 'USER'}]{' '}
									{msg.name || msg.sender_id}
								</p>
								<p className='text-sm text-gray-900 dark:text-gray-100'>
									{msg.message}
								</p>
							</div>
						</div>
					</motion.div>
				))}
				<div ref={bottomRef} />
			</CardContent>

			{/* ✏️ Composer */}
			<div className='flex gap-2 p-4 border-t'>
				<Input
					className='flex-1 rounded-full'
					placeholder='Type a message…'
					value={text}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setText(e.target.value)
					}
					onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
						if (e.key === 'Enter') {
							send().catch((err) => {
								console.error('Failed to send message:', err);
							});
						}
					}}
				/>
				<Button
					className='rounded-full p-2'
					onClick={() => {
						send().catch((err) => {
							console.error('Failed to send message:', err);
						}); // Added closing parenthesis here
					}}
				>
					<Send size={18} />
				</Button>
			</div>
		</Card>
	);
};

export default ChatPanel;
