// @ts-nocheck
import { useCallback } from 'react';
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  BackgroundVariant,
  Position,
  Handle
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Button } from "@whatsapp/components/ui/button";
import { Card } from "@whatsapp/components/ui/card";
import { Save, Play, Plus } from "lucide-react";

// Custom Node Components
const TriggerNode = ({ data }: { data: { label: string } }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-primary min-w-[150px]">
      <div className="font-bold text-sm text-primary mb-1">Trigger</div>
      <div className="text-xs text-gray-500">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
    </div>
  );
};

const MessageNode = ({ data }: { data: { label: string } }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border border-gray-200 min-w-[150px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      <div className="font-bold text-sm text-gray-700 mb-1">Send Message</div>
      <div className="text-xs text-gray-500">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
};

const ConditionNode = ({ data }: { data: { label: string } }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border border-orange-300 min-w-[150px] relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      <div className="font-bold text-sm text-orange-600 mb-1">Condition</div>
      <div className="text-xs text-gray-500">{data.label}</div>
      
      <div className="absolute -bottom-6 left-1/4 text-[10px] text-gray-500">Yes</div>
      <Handle type="source" position={Position.Bottom} id="a" className="w-3 h-3 bg-green-500 left-1/4" />
      
      <div className="absolute -bottom-6 right-1/4 text-[10px] text-gray-500">No</div>
      <Handle type="source" position={Position.Bottom} id="b" className="w-3 h-3 bg-red-500 left-3/4" />
    </div>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  condition: ConditionNode,
};

const initialNodes = [
  { id: '1', type: 'trigger', position: { x: 250, y: 0 }, data: { label: 'Incoming Message: "Hello"' } },
  { id: '2', type: 'message', position: { x: 250, y: 100 }, data: { label: 'Reply: Welcome to our service!' } },
  { id: '3', type: 'condition', position: { x: 250, y: 200 }, data: { label: 'Is Business Hours?' } },
  { id: '4', type: 'message', position: { x: 100, y: 300 }, data: { label: 'Reply: How can we help?' } },
  { id: '5', type: 'message', position: { x: 400, y: 300 }, data: { label: 'Reply: We are closed.' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4', sourceHandle: 'a', label: 'Yes' },
  { id: 'e3-5', source: '3', target: '5', sourceHandle: 'b', label: 'No' },
];

export default function Automation() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4 animate-in fade-in duration-500">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Automation Builder</h2>
            <p className="text-muted-foreground">Design your chatbot flows visually.</p>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline">
               <Play className="mr-2 h-4 w-4" />
               Test Flow
             </Button>
             <Button>
               <Save className="mr-2 h-4 w-4" />
               Save Flow
             </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
           {/* Sidebar for Nodes */}
           <Card className="w-60 shrink-0 p-4 flex flex-col gap-3 overflow-y-auto">
             <h3 className="font-medium text-sm mb-2">Elements</h3>
             <div className="p-3 border rounded cursor-grab hover:bg-secondary transition-colors bg-white shadow-sm border-l-4 border-l-primary">
               <span className="font-medium text-sm">Trigger</span>
               <p className="text-xs text-muted-foreground">Start flow</p>
             </div>
             <div className="p-3 border rounded cursor-grab hover:bg-secondary transition-colors bg-white shadow-sm">
               <span className="font-medium text-sm">Send Message</span>
               <p className="text-xs text-muted-foreground">Text, Image, Video</p>
             </div>
             <div className="p-3 border rounded cursor-grab hover:bg-secondary transition-colors bg-white shadow-sm border-l-4 border-l-orange-400">
               <span className="font-medium text-sm">Condition</span>
               <p className="text-xs text-muted-foreground">Branch logic</p>
             </div>
             <div className="p-3 border rounded cursor-grab hover:bg-secondary transition-colors bg-white shadow-sm">
               <span className="font-medium text-sm">Wait</span>
               <p className="text-xs text-muted-foreground">Delay execution</p>
             </div>
             <div className="p-3 border rounded cursor-grab hover:bg-secondary transition-colors bg-white shadow-sm">
               <span className="font-medium text-sm">Assign to Agent</span>
               <p className="text-xs text-muted-foreground">Handover</p>
             </div>
           </Card>

           {/* Canvas */}
           <Card className="flex-1 overflow-hidden border-2 border-muted">
             <ReactFlow
               nodes={nodes}
               edges={edges}
               onNodesChange={onNodesChange}
               onEdgesChange={onEdgesChange}
               onConnect={onConnect}
               nodeTypes={nodeTypes}
               fitView
             >
               <Controls />
               <MiniMap />
               <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
             </ReactFlow>
           </Card>
        </div>
      </div>
    </>
  );
}
