'use client';

import React, { useCallback, useMemo } from 'react';
import {
    ReactFlow,
    Node,
    Edge,
    addEdge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Position,
    MarkerType,
    Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Custom Node Component
const CustomNode = ({ data }: { data: any }) => {
    const { label, type, description, examples } = data;

    const getNodeStyles = () => {
        switch (type) {
            case 'root':
                return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-700';
            case 'category':
                return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-700';
            case 'subcategory':
                return 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-700';
            case 'allocation':
                return 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-700';
            case 'final':
                return 'bg-gradient-to-br from-red-500 to-red-600 text-white border-red-700';
            default:
                return 'bg-white border-gray-300';
        }
    };

    return (
        <div className={`px-4 py-3 rounded-lg border-2 shadow-lg min-w-[200px] ${getNodeStyles()}`}>
            <Handle type="target" position={Position.Left} />
            <div className="font-semibold text-sm mb-1">{label}</div>
            {description && <div className="text-xs opacity-90 mb-2">{description}</div>}
            {examples && (
                <div className="space-y-1">
                    {examples.map((example: string, index: number) => (
                        <Badge key={index} variant="neutral" className="text-xs mr-1 bg-white/20 text-white border-white/30">
                            {example}
                        </Badge>
                    ))}
                </div>
            )}
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode,
};

const CategoryFlowChart = () => {
    const initialNodes: Node[] = useMemo(() => [
        // Root Node
        {
            id: '1',
            type: 'custom',
            position: { x: 0, y: 0 },
            data: {
                label: 'Seat Types',
                type: 'root',
                description: 'MHT-CET Seat Type Categories',
            },
        },

        // Main Seat Type - General
        {
            id: '2',
            type: 'custom',
            position: { x: 400, y: 0 },
            data: {
                label: 'General',
                type: 'category',
                description: 'General seat type',
            },
        },

        // Category Level under General (properly aligned with final codes)
        {
            id: '3',
            type: 'custom',
            position: { x: 800, y: -600 }, // Aligned with OPEN codes
            data: {
                label: 'OPEN',
                type: 'subcategory',
                description: 'Open category',
            },
        },
        {
            id: '4',
            type: 'custom',
            position: { x: 800, y: -250 }, // Aligned with OBC codes
            data: {
                label: 'OBC',
                type: 'subcategory',
                description: 'Other Backward Classes',
            },
        },
        {
            id: '5',
            type: 'custom',
            position: { x: 800, y: 100 }, // Aligned with SC codes
            data: {
                label: 'SC',
                type: 'subcategory',
                description: 'Scheduled Caste',
            },
        },
        {
            id: '6',
            type: 'custom',
            position: { x: 800, y: 450 }, // Aligned with ST codes
            data: {
                label: 'ST',
                type: 'subcategory',
                description: 'Scheduled Tribe',
            },
        },
        {
            id: '7',
            type: 'custom',
            position: { x: 800, y: 800 }, // Aligned with VJ codes
            data: {
                label: 'VJ',
                type: 'subcategory',
                description: 'Vimukta Jati',
            },
        },
        {
            id: '8',
            type: 'custom',
            position: { x: 800, y: 1150 }, // Aligned with NT1 codes
            data: {
                label: 'NT1',
                type: 'subcategory',
                description: 'Nomadic Tribe 1',
            },
        },
        {
            id: '9',
            type: 'custom',
            position: { x: 800, y: 1500 }, // Aligned with NT2 codes
            data: {
                label: 'NT2',
                type: 'subcategory',
                description: 'Nomadic Tribe 2',
            },
        },
        {
            id: '10',
            type: 'custom',
            position: { x: 800, y: 1850 }, // Aligned with NT3 codes
            data: {
                label: 'NT3',
                type: 'subcategory',
                description: 'Nomadic Tribe 3',
            },
        },

        // Final Category Codes - OPEN (no overlap, proper spacing)
        {
            id: '11',
            type: 'custom',
            position: { x: 1200, y: -700 },
            data: {
                label: 'GOPENS',
                type: 'final',
                description: 'General Open State',
            },
        },
        {
            id: '12',
            type: 'custom',
            position: { x: 1200, y: -600 },
            data: {
                label: 'GOPENH',
                type: 'final',
                description: 'General Open Home University',
            },
        },
        {
            id: '13',
            type: 'custom',
            position: { x: 1200, y: -500 },
            data: {
                label: 'GOPENO',
                type: 'final',
                description: 'General Open Other University',
            },
        },

        // Final Category Codes - OBC (no overlap, proper spacing)
        {
            id: '14',
            type: 'custom',
            position: { x: 1200, y: -350 },
            data: {
                label: 'GOBCS',
                type: 'final',
                description: 'General OBC State',
            },
        },
        {
            id: '15',
            type: 'custom',
            position: { x: 1200, y: -250 },
            data: {
                label: 'GOBCH',
                type: 'final',
                description: 'General OBC Home University',
            },
        },
        {
            id: '16',
            type: 'custom',
            position: { x: 1200, y: -150 },
            data: {
                label: 'GOBCO',
                type: 'final',
                description: 'General OBC Other University',
            },
        },

        // Final Category Codes - SC (no overlap, proper spacing)
        {
            id: '17',
            type: 'custom',
            position: { x: 1200, y: 0 },
            data: {
                label: 'GSCS',
                type: 'final',
                description: 'General SC State',
            },
        },
        {
            id: '18',
            type: 'custom',
            position: { x: 1200, y: 100 },
            data: {
                label: 'GSCH',
                type: 'final',
                description: 'General SC Home University',
            },
        },
        {
            id: '19',
            type: 'custom',
            position: { x: 1200, y: 200 },
            data: {
                label: 'GSCO',
                type: 'final',
                description: 'General SC Other University',
            },
        },

        // Final Category Codes - ST (no overlap, proper spacing)
        {
            id: '20',
            type: 'custom',
            position: { x: 1200, y: 350 },
            data: {
                label: 'GSTS',
                type: 'final',
                description: 'General ST State',
            },
        },
        {
            id: '21',
            type: 'custom',
            position: { x: 1200, y: 450 },
            data: {
                label: 'GSTH',
                type: 'final',
                description: 'General ST Home University',
            },
        },
        {
            id: '22',
            type: 'custom',
            position: { x: 1200, y: 550 },
            data: {
                label: 'GSTO',
                type: 'final',
                description: 'General ST Other University',
            },
        },

        // Final Category Codes - VJ (no overlap, proper spacing)
        {
            id: '23',
            type: 'custom',
            position: { x: 1200, y: 700 },
            data: {
                label: 'GVJS',
                type: 'final',
                description: 'General VJ State',
            },
        },
        {
            id: '24',
            type: 'custom',
            position: { x: 1200, y: 800 },
            data: {
                label: 'GVJH',
                type: 'final',
                description: 'General VJ Home University',
            },
        },
        {
            id: '25',
            type: 'custom',
            position: { x: 1200, y: 900 },
            data: {
                label: 'GVJO',
                type: 'final',
                description: 'General VJ Other University',
            },
        },

        // Final Category Codes - NT1 (no overlap, proper spacing)
        {
            id: '26',
            type: 'custom',
            position: { x: 1200, y: 1050 },
            data: {
                label: 'GNT1S',
                type: 'final',
                description: 'General NT1 State',
            },
        },
        {
            id: '27',
            type: 'custom',
            position: { x: 1200, y: 1150 },
            data: {
                label: 'GNT1H',
                type: 'final',
                description: 'General NT1 Home University',
            },
        },
        {
            id: '28',
            type: 'custom',
            position: { x: 1200, y: 1250 },
            data: {
                label: 'GNT1O',
                type: 'final',
                description: 'General NT1 Other University',
            },
        },

        // Final Category Codes - NT2 (no overlap, proper spacing)
        {
            id: '29',
            type: 'custom',
            position: { x: 1200, y: 1400 },
            data: {
                label: 'GNT2S',
                type: 'final',
                description: 'General NT2 State',
            },
        },
        {
            id: '30',
            type: 'custom',
            position: { x: 1200, y: 1500 },
            data: {
                label: 'GNT2H',
                type: 'final',
                description: 'General NT2 Home University',
            },
        },
        {
            id: '31',
            type: 'custom',
            position: { x: 1200, y: 1600 },
            data: {
                label: 'GNT2O',
                type: 'final',
                description: 'General NT2 Other University',
            },
        },

        // Final Category Codes - NT3 (no overlap, proper spacing)
        {
            id: '32',
            type: 'custom',
            position: { x: 1200, y: 1750 },
            data: {
                label: 'GNT3S',
                type: 'final',
                description: 'General NT3 State',
            },
        },
        {
            id: '33',
            type: 'custom',
            position: { x: 1200, y: 1850 },
            data: {
                label: 'GNT3H',
                type: 'final',
                description: 'General NT3 Home University',
            },
        },
        {
            id: '34',
            type: 'custom',
            position: { x: 1200, y: 1950 },
            data: {
                label: 'GNT3O',
                type: 'final',
                description: 'General NT3 Other University',
            },
        },
    ], []);

    const initialEdges: Edge[] = useMemo(() => [
        // Root to General
        { id: 'e1-2', source: '1', target: '2', markerEnd: { type: MarkerType.Arrow }, style: { strokeWidth: 2 } },

        // General to all categories
        { id: 'e2-3', source: '2', target: '3', markerEnd: { type: MarkerType.Arrow }, style: { strokeWidth: 2 } },
        { id: 'e2-4', source: '2', target: '4', markerEnd: { type: MarkerType.Arrow }, style: { strokeWidth: 2 } },
        { id: 'e2-5', source: '2', target: '5', markerEnd: { type: MarkerType.Arrow }, style: { strokeWidth: 2 } },
        { id: 'e2-6', source: '2', target: '6', markerEnd: { type: MarkerType.Arrow }, style: { strokeWidth: 2 } },
        { id: 'e2-7', source: '2', target: '7', markerEnd: { type: MarkerType.Arrow }, style: { strokeWidth: 2 } },
        { id: 'e2-8', source: '2', target: '8', markerEnd: { type: MarkerType.Arrow }, style: { strokeWidth: 2 } },
        { id: 'e2-9', source: '2', target: '9', markerEnd: { type: MarkerType.Arrow }, style: { strokeWidth: 2 } },
        { id: 'e2-10', source: '2', target: '10', markerEnd: { type: MarkerType.Arrow }, style: { strokeWidth: 2 } },

        // OPEN to final codes
        { id: 'e3-11', source: '3', target: '11', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e3-12', source: '3', target: '12', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e3-13', source: '3', target: '13', markerEnd: { type: MarkerType.Arrow } },

        // OBC to final codes
        { id: 'e4-14', source: '4', target: '14', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e4-15', source: '4', target: '15', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e4-16', source: '4', target: '16', markerEnd: { type: MarkerType.Arrow } },

        // SC to final codes
        { id: 'e5-17', source: '5', target: '17', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e5-18', source: '5', target: '18', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e5-19', source: '5', target: '19', markerEnd: { type: MarkerType.Arrow } },

        // ST to final codes
        { id: 'e6-20', source: '6', target: '20', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e6-21', source: '6', target: '21', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e6-22', source: '6', target: '22', markerEnd: { type: MarkerType.Arrow } },

        // VJ to final codes
        { id: 'e7-23', source: '7', target: '23', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e7-24', source: '7', target: '24', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e7-25', source: '7', target: '25', markerEnd: { type: MarkerType.Arrow } },

        // NT1 to final codes
        { id: 'e8-26', source: '8', target: '26', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e8-27', source: '8', target: '27', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e8-28', source: '8', target: '28', markerEnd: { type: MarkerType.Arrow } },

        // NT2 to final codes
        { id: 'e9-29', source: '9', target: '29', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e9-30', source: '9', target: '30', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e9-31', source: '9', target: '31', markerEnd: { type: MarkerType.Arrow } },

        // NT3 to final codes
        { id: 'e10-32', source: '10', target: '32', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e10-33', source: '10', target: '33', markerEnd: { type: MarkerType.Arrow } },
        { id: 'e10-34', source: '10', target: '34', markerEnd: { type: MarkerType.Arrow } },
    ], []);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: any) => setEdges((eds: Edge[]) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <Card className="w-full h-[800px] bg-gradient-to-br from-gray-50 to-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-abel text-xl">
                    <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                        </svg>
                    </div>
                    MHT-CET Category Code Structure
                </CardTitle>
                <div className="text-sm text-muted-foreground font-abel">
                    Interactive flow chart showing the hierarchy: Seat Types → General → Categories → Final Codes
                </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-120px)]">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{
                        padding: 0.2,
                        includeHiddenNodes: false,
                    }}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                    minZoom={0.5}
                    maxZoom={2}
                    attributionPosition="bottom-left"
                >
                    <Background color="#f1f5f9" gap={20} />
                    <Controls position="top-right" />
                    <MiniMap
                        position="bottom-right"
                        nodeColor={(node: Node) => {
                            switch (node.data.type) {
                                case 'root': return '#3b82f6';
                                case 'category': return '#8b5cf6';
                                case 'subcategory': return '#10b981';
                                case 'allocation': return '#f59e0b';
                                case 'final': return '#ef4444';
                                default: return '#6b7280';
                            }
                        }}
                        maskColor="rgba(255, 255, 255, 0.8)"
                    />
                </ReactFlow>
            </CardContent>
        </Card>
    );
};

export default CategoryFlowChart;
