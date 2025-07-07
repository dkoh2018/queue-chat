import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { XIcon } from '@/components/icons';

interface MessageQueueViewProps {
  messageQueue: string[];
  onRemoveMessage: (index: number) => void;
  onReorderQueue: (startIndex: number, endIndex: number) => void;
  isProcessing: boolean;
  isVisible: boolean;
}

interface SortableItemProps {
  id: string;
  message: string;
  index: number;
  onRemoveMessage: (index: number) => void;
  isProcessing: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, message, index, onRemoveMessage, isProcessing }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center justify-between text-gray-300 glass-card p-2 rounded-md cursor-grab active:cursor-grabbing ${
        isProcessing && index === 0 ? 'animate-pulse glass-glow-green' : ''
      }`}
    >
      <span className="font-mono text-xs sm:text-sm mr-2 flex-shrink-0">{`[${index + 1}]`}</span>
      <span className="flex-1 truncate pr-2 text-sm">{message}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemoveMessage(index);
        }}
        className="text-gray-400 hover:text-white glass-button p-1 rounded ml-2"
        title="Remove message"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </li>
  );
};

export const MessageQueueView: React.FC<MessageQueueViewProps> = ({
  messageQueue,
  onRemoveMessage,
  onReorderQueue,
  isProcessing,
  isVisible,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = messageQueue.findIndex((_, index) => `${messageQueue[index]}-${index}` === active.id);
      const newIndex = messageQueue.findIndex((_, index) => `${messageQueue[index]}-${index}` === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderQueue(oldIndex, newIndex);
      }
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute bottom-full right-0 w-80 sm:w-96 z-40 transition-all duration-300 ease-in-out transform translate-y-0 opacity-100 max-w-[calc(100vw-2rem)]" style={{
      marginBottom: '16px'
    }}>
      <div className="glass-panel rounded-t-2xl rounded-bl-2xl p-3 sm:p-4 border-b border-gray-600/50">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white">
            {messageQueue.length === 0 ? 'No Queue' : `Next Prompt (${messageQueue.length})`}
          </h3>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={messageQueue.map((message, index) => `${message}-${index}`)}
            strategy={verticalListSortingStrategy}
          >
            <ul className={`space-y-2 overflow-y-auto chat-scroll transition-all duration-300 ${
              messageQueue.length === 0 
                ? 'h-16'
                : messageQueue.length <= 4
                ? 'min-h-16 h-auto'
                : 'max-h-80 h-auto'
            }`}>
              {messageQueue.length === 0 ? (
                <li className="text-gray-400 text-center py-4 italic">
                  No messages queued... yet!
                </li>
              ) : (
                messageQueue.map((message, index) => (
                  <SortableItem
                    key={`${message}-${index}`}
                    id={`${message}-${index}`}
                    message={message}
                    index={index}
                    onRemoveMessage={onRemoveMessage}
                    isProcessing={isProcessing}
                  />
                ))
              )}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};