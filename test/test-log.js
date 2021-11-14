const testLog = ".* Event = \"(?<event>.*)\"(.|\\n)*?Host = (?<host>.*)(.|\\n)*?VectorClock = \"(?<clock>.*)\"(.|\\n)*?value = \\((?<values>.*)\\)\n" +
"\n" +
"@!@!@ENDMSG 2264 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"1: <Initial predicate>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = (ClientA :> Null @@ ClientB :> Null)\n" +
"/\\ pc = ( ClientA :> \"SendDatabase\" @@\n" +
"  ClientB :> \"SendDatabase\" @@\n" +
"  Database :> \"Receive\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = (Database :> Null @@ Cache :> Null)\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ Event = Null\n" +
"/\\ Host = Null\n" +
"/\\ VectorClock = (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0)\n" +
"/\\ received = (Database :> 0 @@ Cache :> 0)\n" +
"/\\ Messages = (ClientA :> <<>> @@ ClientB :> <<>> @@ Database :> <<>> @@ Cache :> <<>>)\n" +
"/\\ value = (Database :> Null @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"2: <SendDatabase line 140, col 23 to line 155, col 74 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = (ClientA :> Null @@ ClientB :> Null)\n" +
"/\\ pc = ( ClientA :> \"SendDatabase\" @@\n" +
"  ClientB :> \"GetAckDatabase\" @@\n" +
"  Database :> \"Receive\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = (Database :> Null @@ Cache :> Null)\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ Event = \"SendDatabase\"\n" +
"/\\ Host = ClientB\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":0,\\\"ClientB\\\":1,\\\"Database\\\":0,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 0 @@ Cache :> 0)\n" +
"/\\ Messages = ( ClientA :> <<>> @@\n" +
"  ClientB :> <<>> @@\n" +
"  Database :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0),\n" +
"           value |-> ClientB,\n" +
"           destination |-> Database,\n" +
"           source |-> ClientB ] >> @@\n" +
"  Cache :> <<>> )\n" +
"/\\ value = (Database :> Null @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"3: <SendDatabase line 140, col 23 to line 155, col 74 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = (ClientA :> Null @@ ClientB :> Null)\n" +
"/\\ pc = ( ClientA :> \"GetAckDatabase\" @@\n" +
"  ClientB :> \"GetAckDatabase\" @@\n" +
"  Database :> \"Receive\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = (Database :> Null @@ Cache :> Null)\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ Event = \"SendDatabase\"\n" +
"/\\ Host = ClientA\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":1,\\\"ClientB\\\":0,\\\"Database\\\":0,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 0 @@ Cache :> 0)\n" +
"/\\ Messages = ( ClientA :> <<>> @@\n" +
"  ClientB :> <<>> @@\n" +
"  Database :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0),\n" +
"           value |-> ClientB,\n" +
"           destination |-> Database,\n" +
"           source |-> ClientB ],\n" +
"         [ clock |->\n" +
"               (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"           value |-> ClientA,\n" +
"           destination |-> Database,\n" +
"           source |-> ClientA ] >> @@\n" +
"  Cache :> <<>> )\n" +
"/\\ value = (Database :> Null @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"4: <Receive line 205, col 18 to line 216, col 71 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 1 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = (ClientA :> Null @@ ClientB :> Null)\n" +
"/\\ pc = ( ClientA :> \"GetAckDatabase\" @@\n" +
"  ClientB :> \"GetAckDatabase\" @@\n" +
"  Database :> \"SendAck\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientB,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientB ] @@\n" +
"  Cache :> Null )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ Event = \"Receive\"\n" +
"/\\ Host = Database\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":0,\\\"ClientB\\\":1,\\\"Database\\\":1,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 1 @@ Cache :> 0)\n" +
"/\\ Messages = ( ClientA :> <<>> @@\n" +
"  ClientB :> <<>> @@\n" +
"  Database :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"           value |-> ClientA,\n" +
"           destination |-> Database,\n" +
"           source |-> ClientA ] >> @@\n" +
"  Cache :> <<>> )\n" +
"/\\ value = (Database :> ClientB @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"5: <SendAck line 218, col 18 to line 235, col 61 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = (ClientA :> Null @@ ClientB :> Null)\n" +
"/\\ pc = ( ClientA :> \"GetAckDatabase\" @@\n" +
"  ClientB :> \"GetAckDatabase\" @@\n" +
"  Database :> \"Receive\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientB,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientB ] @@\n" +
"  Cache :> Null )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ Event = \"SendAck\"\n" +
"/\\ Host = Database\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":0,\\\"ClientB\\\":1,\\\"Database\\\":2,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 1 @@ Cache :> 0)\n" +
"/\\ Messages = ( ClientA :> <<>> @@\n" +
"  ClientB :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"           value |-> Ack,\n" +
"           destination |-> ClientB,\n" +
"           source |-> Database ] >> @@\n" +
"  Database :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"           value |-> ClientA,\n" +
"           destination |-> Database,\n" +
"           source |-> ClientA ] >> @@\n" +
"  Cache :> <<>> )\n" +
"/\\ value = (Database :> ClientB @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"6: <Receive line 205, col 18 to line 216, col 71 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 3 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = (ClientA :> Null @@ ClientB :> Null)\n" +
"/\\ pc = ( ClientA :> \"GetAckDatabase\" @@\n" +
"  ClientB :> \"GetAckDatabase\" @@\n" +
"  Database :> \"SendAck\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :> Null )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ Event = \"Receive\"\n" +
"/\\ Host = Database\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":1,\\\"ClientB\\\":1,\\\"Database\\\":3,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 0)\n" +
"/\\ Messages = ( ClientA :> <<>> @@\n" +
"  ClientB :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"           value |-> Ack,\n" +
"           destination |-> ClientB,\n" +
"           source |-> Database ] >> @@\n" +
"  Database :> <<>> @@\n" +
"  Cache :> <<>> )\n" +
"/\\ value = (Database :> ClientA @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"7: <SendAck line 218, col 18 to line 235, col 61 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = (ClientA :> Null @@ ClientB :> Null)\n" +
"/\\ pc = ( ClientA :> \"GetAckDatabase\" @@\n" +
"  ClientB :> \"GetAckDatabase\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :> Null )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ Event = \"SendAck\"\n" +
"/\\ Host = Database\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":1,\\\"ClientB\\\":1,\\\"Database\\\":4,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 0)\n" +
"/\\ Messages = ( ClientA :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"           value |-> Ack,\n" +
"           destination |-> ClientA,\n" +
"           source |-> Database ] >> @@\n" +
"  ClientB :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"           value |-> Ack,\n" +
"           destination |-> ClientB,\n" +
"           source |-> Database ] >> @@\n" +
"  Database :> <<>> @@\n" +
"  Cache :> <<>> )\n" +
"/\\ value = (Database :> ClientA @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"8: <GetAckDatabase line 157, col 25 to line 169, col 59 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Database ] @@\n" +
"  ClientB :> Null )\n" +
"/\\ pc = ( ClientA :> \"SendCache\" @@\n" +
"  ClientB :> \"GetAckDatabase\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :> Null )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 2 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ Event = \"GetAckDatabase\"\n" +
"/\\ Host = ClientA\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":2,\\\"ClientB\\\":1,\\\"Database\\\":4,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 0)\n" +
"/\\ Messages = ( ClientA :> <<>> @@\n" +
"  ClientB :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"           value |-> Ack,\n" +
"           destination |-> ClientB,\n" +
"           source |-> Database ] >> @@\n" +
"  Database :> <<>> @@\n" +
"  Cache :> <<>> )\n" +
"/\\ value = (Database :> ClientA @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"9: <GetAckDatabase line 157, col 25 to line 169, col 59 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Database ] @@\n" +
"  ClientB :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientB,\n" +
"        source |-> Database ] )\n" +
"/\\ pc = ( ClientA :> \"SendCache\" @@\n" +
"  ClientB :> \"SendCache\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :> Null )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 2 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 2 @@ Database :> 2 @@ Cache :> 0) )\n" +
"/\\ Event = \"GetAckDatabase\"\n" +
"/\\ Host = ClientB\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":0,\\\"ClientB\\\":2,\\\"Database\\\":2,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 0)\n" +
"/\\ Messages = (ClientA :> <<>> @@ ClientB :> <<>> @@ Database :> <<>> @@ Cache :> <<>>)\n" +
"/\\ value = (Database :> ClientA @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"10: <SendCache line 171, col 20 to line 186, col 71 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 0 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Database ] @@\n" +
"  ClientB :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientB,\n" +
"        source |-> Database ] )\n" +
"/\\ pc = ( ClientA :> \"GetAckCache\" @@\n" +
"  ClientB :> \"SendCache\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :> Null )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 2 @@ Database :> 2 @@ Cache :> 0) )\n" +
"/\\ Event = \"SendCache\"\n" +
"/\\ Host = ClientA\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":3,\\\"ClientB\\\":1,\\\"Database\\\":4,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 0)\n" +
"/\\ Messages = ( ClientA :> <<>> @@\n" +
"  ClientB :> <<>> @@\n" +
"  Database :> <<>> @@\n" +
"  Cache :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"           value |-> ClientA,\n" +
"           destination |-> Cache,\n" +
"           source |-> ClientA ] >> )\n" +
"/\\ value = (Database :> ClientA @@ Cache :> Null)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"11: <Receive line 205, col 18 to line 216, col 71 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 1) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Database ] @@\n" +
"  ClientB :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientB,\n" +
"        source |-> Database ] )\n" +
"/\\ pc = ( ClientA :> \"GetAckCache\" @@\n" +
"  ClientB :> \"SendCache\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"SendAck\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Cache,\n" +
"        source |-> ClientA ] )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 2 @@ Database :> 2 @@ Cache :> 0) )\n" +
"/\\ Event = \"Receive\"\n" +
"/\\ Host = Cache\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":3,\\\"ClientB\\\":1,\\\"Database\\\":4,\\\"Cache\\\":1}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 1)\n" +
"/\\ Messages = (ClientA :> <<>> @@ ClientB :> <<>> @@ Database :> <<>> @@ Cache :> <<>>)\n" +
"/\\ value = (Database :> ClientA @@ Cache :> ClientA)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"12: <SendAck line 218, col 18 to line 235, col 61 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Database ] @@\n" +
"  ClientB :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientB,\n" +
"        source |-> Database ] )\n" +
"/\\ pc = ( ClientA :> \"GetAckCache\" @@\n" +
"  ClientB :> \"SendCache\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Cache,\n" +
"        source |-> ClientA ] )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 2 @@ Database :> 2 @@ Cache :> 0) )\n" +
"/\\ Event = \"SendAck\"\n" +
"/\\ Host = Cache\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":3,\\\"ClientB\\\":1,\\\"Database\\\":4,\\\"Cache\\\":2}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 1)\n" +
"/\\ Messages = ( ClientA :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2),\n" +
"           value |-> Ack,\n" +
"           destination |-> ClientA,\n" +
"           source |-> Cache ] >> @@\n" +
"  ClientB :> <<>> @@\n" +
"  Database :> <<>> @@\n" +
"  Cache :> <<>> )\n" +
"/\\ value = (Database :> ClientA @@ Cache :> ClientA)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"13: <GetAckCache line 188, col 22 to line 200, col 56 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Cache ] @@\n" +
"  ClientB :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientB,\n" +
"        source |-> Database ] )\n" +
"/\\ pc = ( ClientA :> \"Done\" @@\n" +
"  ClientB :> \"SendCache\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Cache,\n" +
"        source |-> ClientA ] )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 4 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 2 @@ Database :> 2 @@ Cache :> 0) )\n" +
"/\\ Event = \"GetAckCache\"\n" +
"/\\ Host = ClientA\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":4,\\\"ClientB\\\":1,\\\"Database\\\":4,\\\"Cache\\\":2}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 1)\n" +
"/\\ Messages = (ClientA :> <<>> @@ ClientB :> <<>> @@ Database :> <<>> @@ Cache :> <<>>)\n" +
"/\\ value = (Database :> ClientA @@ Cache :> ClientA)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"14: <SendCache line 171, col 20 to line 186, col 71 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Cache ] @@\n" +
"  ClientB :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientB,\n" +
"        source |-> Database ] )\n" +
"/\\ pc = ( ClientA :> \"Done\" @@\n" +
"  ClientB :> \"GetAckCache\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"Receive\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Cache,\n" +
"        source |-> ClientA ] )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 4 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 3 @@ Database :> 2 @@ Cache :> 0) )\n" +
"/\\ Event = \"SendCache\"\n" +
"/\\ Host = ClientB\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":0,\\\"ClientB\\\":3,\\\"Database\\\":2,\\\"Cache\\\":0}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 1)\n" +
"/\\ Messages = ( ClientA :> <<>> @@\n" +
"  ClientB :> <<>> @@\n" +
"  Database :> <<>> @@\n" +
"  Cache :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 0 @@ ClientB :> 3 @@ Database :> 2 @@ Cache :> 0),\n" +
"           value |-> ClientB,\n" +
"           destination |-> Cache,\n" +
"           source |-> ClientB ] >> )\n" +
"/\\ value = (Database :> ClientA @@ Cache :> ClientA)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"15: <Receive line 205, col 18 to line 216, col 71 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 3 @@ ClientB :> 3 @@ Database :> 4 @@ Cache :> 3) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Cache ] @@\n" +
"  ClientB :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientB,\n" +
"        source |-> Database ] )\n" +
"/\\ pc = ( ClientA :> \"Done\" @@\n" +
"  ClientB :> \"GetAckCache\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"SendAck\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 3 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> ClientB,\n" +
"        destination |-> Cache,\n" +
"        source |-> ClientB ] )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 4 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 3 @@ Database :> 2 @@ Cache :> 0) )\n" +
"/\\ Event = \"Receive\"\n" +
"/\\ Host = Cache\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":3,\\\"ClientB\\\":3,\\\"Database\\\":4,\\\"Cache\\\":3}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 2)\n" +
"/\\ Messages = (ClientA :> <<>> @@ ClientB :> <<>> @@ Database :> <<>> @@ Cache :> <<>>)\n" +
"/\\ value = (Database :> ClientA @@ Cache :> ClientB)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"16: <SendAck line 218, col 18 to line 235, col 61 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 3 @@ ClientB :> 3 @@ Database :> 4 @@ Cache :> 4) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Cache ] @@\n" +
"  ClientB :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 1 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientB,\n" +
"        source |-> Database ] )\n" +
"/\\ pc = ( ClientA :> \"Done\" @@\n" +
"  ClientB :> \"GetAckCache\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"Done\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 3 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> ClientB,\n" +
"        destination |-> Cache,\n" +
"        source |-> ClientB ] )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 4 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2) @@\n" +
"  ClientB :> (ClientA :> 0 @@ ClientB :> 3 @@ Database :> 2 @@ Cache :> 0) )\n" +
"/\\ Event = \"SendAck\"\n" +
"/\\ Host = Cache\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":3,\\\"ClientB\\\":3,\\\"Database\\\":4,\\\"Cache\\\":4}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 2)\n" +
"/\\ Messages = ( ClientA :> <<>> @@\n" +
"  ClientB :>\n" +
"      << [ clock |->\n" +
"               (ClientA :> 3 @@ ClientB :> 3 @@ Database :> 4 @@ Cache :> 4),\n" +
"           value |-> Ack,\n" +
"           destination |-> ClientB,\n" +
"           source |-> Cache ] >> @@\n" +
"  Database :> <<>> @@\n" +
"  Cache :> <<>> )\n" +
"/\\ value = (Database :> ClientA @@ Cache :> ClientB)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2217:4 @!@!@\n" +
"17: <GetAckCache line 188, col 22 to line 200, col 56 of module dual_writes_vector_clock>\n" +
"/\\ localVectorClock = ( Database :> (ClientA :> 1 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 0) @@\n" +
"  Cache :> (ClientA :> 3 @@ ClientB :> 3 @@ Database :> 4 @@ Cache :> 4) )\n" +
"/\\ receivedMessage_ = ( ClientA :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientA,\n" +
"        source |-> Cache ] @@\n" +
"  ClientB :>\n" +
"      [ clock |-> (ClientA :> 3 @@ ClientB :> 3 @@ Database :> 4 @@ Cache :> 4),\n" +
"        value |-> Ack,\n" +
"        destination |-> ClientB,\n" +
"        source |-> Cache ] )\n" +
"/\\ pc = ( ClientA :> \"Done\" @@\n" +
"  ClientB :> \"Done\" @@\n" +
"  Database :> \"Done\" @@\n" +
"  Cache :> \"Done\" )\n" +
"/\\ receivedMessage = ( Database :>\n" +
"      [ clock |-> (ClientA :> 1 @@ ClientB :> 0 @@ Database :> 0 @@ Cache :> 0),\n" +
"        value |-> ClientA,\n" +
"        destination |-> Database,\n" +
"        source |-> ClientA ] @@\n" +
"  Cache :>\n" +
"      [ clock |-> (ClientA :> 0 @@ ClientB :> 3 @@ Database :> 2 @@ Cache :> 0),\n" +
"        value |-> ClientB,\n" +
"        destination |-> Cache,\n" +
"        source |-> ClientB ] )\n" +
"/\\ localVectorClock_ = ( ClientA :> (ClientA :> 4 @@ ClientB :> 1 @@ Database :> 4 @@ Cache :> 2) @@\n" +
"  ClientB :> (ClientA :> 3 @@ ClientB :> 4 @@ Database :> 4 @@ Cache :> 4) )\n" +
"/\\ Event = \"GetAckCache\"\n" +
"/\\ Host = ClientB\n" +
"/\\ VectorClock = \"{\\\"ClientA\\\":3,\\\"ClientB\\\":4,\\\"Database\\\":4,\\\"Cache\\\":4}\"\n" +
"/\\ received = (Database :> 2 @@ Cache :> 2)\n" +
"/\\ Messages = (ClientA :> <<>> @@ ClientB :> <<>> @@ Database :> <<>> @@ Cache :> <<>>)\n" +
"/\\ value = (Database :> ClientA @@ Cache :> ClientB)\n" +
"\n" +
"@!@!@ENDMSG 2217 @!@!@\n" +
"@!@!@STARTMSG 2218:4 @!@!@\n" +
"18: Stuttering\n";