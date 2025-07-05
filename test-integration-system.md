# Integration System Test Plan

## Test 1: Normal Chat (Base Prompt Only)
1. Start app without any integrations active
2. Send message: "Hello, how are you?"
3. Expected: Friendly AI response using base personality

## Test 2: Mermaid Integration
1. Click Mermaid integration button
2. Send message: "Create a flowchart for user login process"
3. Expected: Mermaid diagram with proper syntax

## Test 3: Conversation History Limit
1. Send 25+ messages in a conversation
2. Check logs for "historyLimitApplied: true"
3. Expected: Only last 20 messages sent to OpenAI

## Test 4: Integration Persistence
1. Activate Mermaid integration
2. Refresh page
3. Expected: Mermaid integration still active (localStorage)

## System Architecture Verification
- ✅ Base prompt always applied first
- ✅ Integration prompts layered on top
- ✅ Conversation history limited to 20 messages
- ✅ No duplicate prompts in codebase
- ✅ Modular integration system ready for Calendar migration