import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { XIcon } from './icons';

interface MessageQueueViewProps {
  messageQueue: string[];
  onRemoveMessage: (index: number) => void;
  onClearQueue: () => void;
  onReorderQueue: (startIndex: number, endIndex: number) => void;
  isProcessing: boolean;
}

export const MessageQueueView: React.FC<MessageQueueViewProps> = ({
  messageQueue,
  onRemoveMessage,
  onClearQueue,
  onReorderQueue,
  isProcessing,
}) => {
  const hasQueue = messageQueue.length > 0;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    onReorderQueue(result.source.index, result.destination.index);
  };

  return (
    <div
      className={`absolute bottom-full left-0 right-0 z-0 transition-all duration-300 ease-in-out ${
        hasQueue ? 'transform translate-y-0 opacity-100' : 'transform translate-y-full opacity-0'
      }`}
    >
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 shadow-lg rounded-t-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white">Message Queue</h3>
          <button
            onClick={onClearQueue}
            className="text-gray-400 hover:text-white transition-colors"
            title="Clear queue"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId="messageQueue"
            isDropDisabled={false}
            isCombineEnabled={false}
            ignoreContainerClipping={false}
          >
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 max-h-48 overflow-y-auto"
              >
                {messageQueue.map((message, index) => (
                  <Draggable key={message} draggableId={message} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex items-center justify-between text-gray-300 bg-gray-700/50 p-2 rounded-md ${
                          isProcessing && index === 0 ? 'animate-pulse border border-blue-500 shadow-lg shadow-blue-500/50' : ''
                        }`}
                      >
                        <span className="font-mono text-sm mr-2">{`[${index + 1}]`}</span>
                        <span className="flex-1">{message}</span>
                        <button
                          onClick={() => onRemoveMessage(index)}
                          className="text-gray-400 hover:text-white transition-colors ml-2"
                          title="Remove message"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};