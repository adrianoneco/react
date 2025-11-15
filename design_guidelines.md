# ChatApp Design Guidelines

## Design Approach
**User-Specified Aesthetic**: Blue and purple gradient interface with collapsible sidebar navigation. This is a messaging/chat application requiring clear visual hierarchy and intuitive interaction patterns while maintaining the specified color scheme.

## Core Design Elements

### Typography
- **Primary Font**: Inter or DM Sans via Google Fonts CDN
- **Hierarchy**:
  - Headers: font-bold text-2xl to text-3xl
  - Body text: font-normal text-base
  - Timestamps/meta: font-medium text-sm text-gray-500
  - User names in chat: font-semibold text-sm

### Layout System
**Spacing Units**: Tailwind units of 2, 3, 4, 6, and 8 (e.g., p-4, m-6, gap-3)
- Consistent padding: p-4 for cards, p-6 for main containers
- Message bubbles: px-4 py-2
- Sidebar items: px-4 py-3

### Header (Fixed Top)
- **Gradient Background**: `bg-gradient-to-r from-blue-600 to-purple-600`
- **Height**: h-16
- **Layout**: Flex container with space-between
- **Left Section**: Logo + collapse button (gap-3)
- **Right Section**: User avatar, name, and dropdown menu
- **Shadow**: shadow-md for depth

### Sidebar (Collapsible)
- **Width**: w-64 when expanded, w-0 when collapsed
- **Transition**: transition-all duration-300 ease-in-out
- **Background**: bg-white with border-r border-gray-200
- **Active Link Indicator**: 4px left border (border-l-4 border-blue-600) + bg-blue-50
- **Link Items**: 
  - Padding: px-4 py-3
  - Hover: bg-gray-50
  - Icon + text layout with gap-3
  - Icons from Heroicons (outline style)

### Content Area
- **Main Container**: flex-1 with p-6
- **Alert/Notice Component**:
  - Background: bg-blue-50 border-l-4 border-blue-600
  - Padding: p-4
  - Layout: Flex with icon (Heroicons info-circle) + text
  - Icon color: text-blue-600
  - Text: text-blue-800

### Chat Interface Components
- **Message List**: Scrollable container with max-h-screen - space for input
- **Message Bubbles**:
  - Sent messages: bg-blue-600 text-white ml-auto max-w-xs rounded-2xl rounded-br-md
  - Received messages: bg-gray-100 text-gray-900 mr-auto max-w-xs rounded-2xl rounded-bl-md
  - Padding: px-4 py-2
  - Timestamps: text-xs mt-1 (right for sent, left for received)
  
- **Input Area**:
  - Fixed bottom or sticky bottom
  - Background: bg-white border-t border-gray-200
  - Layout: Flex with input field + send button
  - Input: flex-1 with p-3 rounded-full bg-gray-100
  - Send button: bg-blue-600 hover:bg-blue-700 rounded-full p-3

### Component Library

**Navigation**:
- Sidebar links with icons (Heroicons: ChatBubbleLeftIcon, UserGroupIcon, Cog6ToothIcon)
- Collapse toggle button (ChevronLeftIcon/ChevronRightIcon)

**Forms** (Login/Register):
- Input fields: border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500
- Labels: text-sm font-medium text-gray-700 mb-1
- Submit button: bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg

**User Elements**:
- Avatar: rounded-full w-10 h-10 (header), w-8 h-8 (chat)
- Online status indicator: absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white

**Icons**: Heroicons via CDN (outline for navigation, solid for actions)

### Responsive Behavior
- Mobile (< 768px): Sidebar overlays content when open, hamburger menu visible
- Desktop: Sidebar persistent, can be collapsed to icon-only view
- Header remains fixed at all breakpoints

### Accessibility
- Focus states: ring-2 ring-blue-500 on all interactive elements
- ARIA labels for collapse button, icon-only states
- Keyboard navigation support for sidebar and chat input
- High contrast maintained in gradient (white text on blue/purple)

### Animations
**Minimal, purposeful only**:
- Sidebar collapse/expand: transition-all duration-300
- Message send: Subtle fade-in for new messages (animate-fade-in)
- No hover animations beyond color changes

## Portuguese (pt-BR) Localization
All UI text in Portuguese: "Entrar", "Sair", "Enviar mensagem", "Conversas", "Configurações", date/time via getDate() and getTime() utilities formatted as "DD/MM/YYYY" and "HH:mm"