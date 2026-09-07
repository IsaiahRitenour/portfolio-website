const header = document.querySelector("[data-header]");

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

if (header) {
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

const workflowData = {
  "startTicketThread": {
    "title": "Start Ticket Email Thread",
    "status": "Ticket Workflow 1/4",
    "summary": "Finds Asana tickets that need an outbound email conversation, sends the first message, and stores the thread relationship so future replies stay connected to the right task.",
    "nodes": [
      {
        "id": "scheduleTrigger",
        "label": "Schedule Trigger",
        "type": "Schedule Trigger",
        "icon": "CR",
        "operation": "Scheduled Trigger",
        "x": 120,
        "y": 256,
        "description": "Runs the workflow on a schedule, which keeps the ticket email loop working without needing a public webhook endpoint.",
        "value": "Starts the recurring check for Asana tickets that may need an email thread."
      },
      {
        "id": "getManyMessages",
        "label": "Get Sent Messages",
        "type": "Microsoft Outlook",
        "icon": "MS",
        "operation": "Microsoft Outlook: getAll",
        "x": 1912,
        "y": 160,
        "description": "Looks back through sent email so the workflow can find the new thread that was just created.",
        "value": "Collects recent sent messages for thread matching."
      },
      {
        "id": "wait",
        "label": "Wait",
        "type": "Wait",
        "icon": "WT",
        "operation": "Wait Step",
        "x": 1688,
        "y": 160,
        "description": "Pauses briefly after sending the ticket email so Outlook has time to make the new message available.",
        "value": "Adds a short delay before checking sent mail."
      },
      {
        "id": "noOperationDoNothing",
        "label": "No Operation",
        "type": "No Operation",
        "icon": ">>",
        "operation": "No Operation",
        "x": 1464,
        "y": 352,
        "description": "Ends this branch when the workflow determines there is nothing useful to send.",
        "value": "Stops the inactive branch cleanly."
      },
      {
        "id": "getManyFromProject",
        "label": "Get Project Tasks",
        "type": "Asana",
        "icon": "AS",
        "operation": "Asana: getAll",
        "x": 344,
        "y": 256,
        "description": "Pulls ticket tasks from the Asana project so the workflow can decide which ones need an email thread.",
        "value": "Reads candidate ticket tasks from Asana."
      },
      {
        "id": "returnMoreTaskDetails",
        "label": "Get Full Task Details",
        "type": "HTTP Request",
        "icon": "API",
        "operation": "HTTP Request",
        "x": 568,
        "y": 256,
        "description": "Fetches additional task fields that are not included in the first Asana project lookup.",
        "value": "Expands each ticket with the fields needed for email routing."
      },
      {
        "id": "extractAsanaTaskDetailsAndEmail",
        "label": "Extract Task and Email Details",
        "type": "Code",
        "icon": "{}",
        "operation": "Code Transform",
        "x": 792,
        "y": 256,
        "description": "Normalizes the task information and pulls out the email-related fields needed by later steps.",
        "value": "Turns raw task data into clean routing records."
      },
      {
        "id": "ifEmailThreadIsNotCreatedYet",
        "label": "Check For Existing Thread",
        "type": "Data Table",
        "icon": "DB",
        "operation": "Data Table: rowNotExists",
        "x": 1016,
        "y": 256,
        "description": "Checks the tracking table so the workflow does not start a duplicate email thread for the same ticket.",
        "value": "Continues only when the ticket is not already tracked."
      },
      {
        "id": "ifEmailFieldIsNotEmpty",
        "label": "Confirm Email Exists",
        "type": "Condition",
        "icon": "IF",
        "operation": "Conditional Branch",
        "x": 1240,
        "y": 256,
        "description": "Makes sure the ticket has an email address before attempting to start the outbound conversation.",
        "value": "Splits valid email records from incomplete tickets."
      },
      {
        "id": "sendEmailStartThread",
        "label": "Start Email Thread",
        "type": "Microsoft Outlook",
        "icon": "MS",
        "operation": "Microsoft Outlook",
        "x": 1464,
        "y": 160,
        "description": "Sends the first email to the ticket submitter so future replies can happen in a normal email thread.",
        "value": "Creates the outbound ticket email."
      },
      {
        "id": "extractTaskidAndOtherInformationAboutEmailSSent",
        "label": "Extract Sent Email Metadata",
        "type": "Code",
        "icon": "{}",
        "operation": "Code Transform",
        "x": 2136,
        "y": 160,
        "description": "Matches the sent email back to the Asana ticket and prepares the safe tracking record.",
        "value": "Builds the link between ticket and email thread."
      },
      {
        "id": "upsertEmailAsStartedThread",
        "label": "Save Started Thread",
        "type": "Data Table",
        "icon": "DB",
        "operation": "Data Table: upsert",
        "x": 2360,
        "y": 160,
        "description": "Stores the ticket-to-email relationship so later workflows know which replies belong to which task.",
        "value": "Writes or updates the thread tracking row."
      }
    ],
    "edges": [
      [
        "scheduleTrigger",
        "getManyFromProject"
      ],
      [
        "getManyMessages",
        "extractTaskidAndOtherInformationAboutEmailSSent"
      ],
      [
        "wait",
        "getManyMessages"
      ],
      [
        "getManyFromProject",
        "returnMoreTaskDetails"
      ],
      [
        "returnMoreTaskDetails",
        "extractAsanaTaskDetailsAndEmail"
      ],
      [
        "extractAsanaTaskDetailsAndEmail",
        "ifEmailThreadIsNotCreatedYet"
      ],
      [
        "ifEmailThreadIsNotCreatedYet",
        "ifEmailFieldIsNotEmpty"
      ],
      [
        "ifEmailFieldIsNotEmpty",
        "sendEmailStartThread"
      ],
      [
        "ifEmailFieldIsNotEmpty",
        "noOperationDoNothing"
      ],
      [
        "sendEmailStartThread",
        "wait"
      ],
      [
        "extractTaskidAndOtherInformationAboutEmailSSent",
        "upsertEmailAsStartedThread"
      ]
    ]
  },
  "emailReplyToAsana": {
    "title": "Make Asana Comment From Ticket Email Thread",
    "status": "Ticket Workflow 2/4",
    "summary": "Checks the ticket inbox for replies, filters out messages that should be ignored, matches each valid reply to its Asana task, and posts the response as a task comment.",
    "nodes": [
      {
        "id": "scheduleTrigger",
        "label": "Schedule Trigger",
        "type": "Schedule Trigger",
        "icon": "CR",
        "operation": "Scheduled Trigger",
        "x": 120,
        "y": 336,
        "description": "Runs the inbox-to-Asana workflow on a schedule so replies can be collected without needing a public webhook.",
        "value": "Starts the recurring email reply check."
      },
      {
        "id": "merge",
        "label": "Merge",
        "type": "Merge",
        "icon": "MG",
        "operation": "Merge Inputs",
        "x": 1464,
        "y": 224,
        "description": "Brings processed reply records back into one path before the tracking table is updated.",
        "value": "Combines the comment-created path with the already-handled path."
      },
      {
        "id": "noOperationDoNothing",
        "label": "No Operation",
        "type": "No Operation",
        "icon": ">>",
        "operation": "No Operation",
        "x": 792,
        "y": 432,
        "description": "Stops the branch when an email should not become a new Asana comment.",
        "value": "Ends ignored or invalid messages cleanly."
      },
      {
        "id": "checkIfEmailsAreInternalNotFromCode",
        "label": "Filter Internal/System Emails",
        "type": "Condition",
        "icon": "IF",
        "operation": "Conditional Branch",
        "x": 568,
        "y": 336,
        "description": "Filters out messages that should not be treated as customer ticket replies.",
        "value": "Routes usable replies forward and sends ignored messages to the stop branch."
      },
      {
        "id": "findItTicketEmails",
        "label": "Match Reply To Ticket",
        "type": "Code",
        "icon": "{}",
        "operation": "Code Transform",
        "x": 792,
        "y": 240,
        "description": "Matches each incoming email reply to the existing ticket thread stored by the ticket system.",
        "value": "Connects an inbox reply to its Asana task."
      },
      {
        "id": "addCommentToOriginalTask",
        "label": "Add Comment to Original Task",
        "type": "Asana",
        "icon": "AS",
        "operation": "Asana: taskComment",
        "x": 1240,
        "y": 160,
        "description": "Adds the cleaned email response as a comment on the original Asana ticket.",
        "value": "Posts the ticket submitter's reply back into Asana."
      },
      {
        "id": "checkIfEmailReplyWasCreatedAsAComment",
        "label": "Check If Reply Was Processed",
        "type": "Data Table",
        "icon": "DB",
        "operation": "Data Table: rowNotExists",
        "x": 1016,
        "y": 224,
        "description": "Checks the tracking table so the same email reply does not get added to Asana more than once.",
        "value": "Continues only when the reply has not already been recorded."
      },
      {
        "id": "upsertProcessedEmail",
        "label": "Upsert Processed Email",
        "type": "Data Table",
        "icon": "DB",
        "operation": "Data Table: upsert",
        "x": 1688,
        "y": 224,
        "description": "Records the email reply after it has been handled so future runs can skip it.",
        "value": "Writes or updates the processed-reply tracking row."
      },
      {
        "id": "getMessagesFromChosenInbox",
        "label": "Get Messages from Chosen Inbox",
        "type": "Microsoft Outlook",
        "icon": "MS",
        "operation": "Microsoft Outlook: getAll",
        "x": 344,
        "y": 336,
        "description": "Reads recent messages from the ticket inbox so the workflow can look for customer replies.",
        "value": "Collects candidate ticket reply emails."
      }
    ],
    "edges": [
      [
        "scheduleTrigger",
        "getMessagesFromChosenInbox"
      ],
      [
        "merge",
        "upsertProcessedEmail"
      ],
      [
        "checkIfEmailsAreInternalNotFromCode",
        "findItTicketEmails"
      ],
      [
        "checkIfEmailsAreInternalNotFromCode",
        "noOperationDoNothing"
      ],
      [
        "findItTicketEmails",
        "checkIfEmailReplyWasCreatedAsAComment"
      ],
      [
        "addCommentToOriginalTask",
        "merge"
      ],
      [
        "checkIfEmailReplyWasCreatedAsAComment",
        "addCommentToOriginalTask"
      ],
      [
        "checkIfEmailReplyWasCreatedAsAComment",
        "merge"
      ],
      [
        "getMessagesFromChosenInbox",
        "checkIfEmailsAreInternalNotFromCode"
      ]
    ]
  },
  "asanaNotifyReply": {
    "title": "Reply To Ticket Email From Asana",
    "status": "Ticket Workflow 3/4",
    "summary": "Looks for Asana comments marked with the notify trigger, cleans the message, finds the original email thread, sends the reply, and records that the comment was handled.",
    "nodes": [
      {
        "id": "scheduleTrigger",
        "label": "Schedule Trigger",
        "type": "Schedule Trigger",
        "icon": "CR",
        "operation": "Scheduled Trigger",
        "x": 120,
        "y": 256,
        "description": "Runs the Asana-to-email reply workflow on a schedule so staff can send replies without a public trigger.",
        "value": "Starts the recurring check for Asana comments that should notify the requester."
      },
      {
        "id": "noOperationDoNothing",
        "label": "No Operation",
        "type": "No Operation",
        "icon": ">>",
        "operation": "No Operation",
        "x": 1240,
        "y": 352,
        "description": "Stops the branch when a comment is not meant to be sent back to the requester.",
        "value": "Ends comments that do not contain the notify trigger."
      },
      {
        "id": "getTasksFromProject",
        "label": "Get Tasks From Project",
        "type": "Asana",
        "icon": "AS",
        "operation": "Asana: getAll",
        "x": 344,
        "y": 256,
        "description": "Pulls active ticket tasks from the Asana project so their comments can be reviewed.",
        "value": "Reads candidate Asana tasks for outbound replies."
      },
      {
        "id": "getCommentsFromTasks",
        "label": "Get Comments From Tasks",
        "type": "HTTP Request",
        "icon": "API",
        "operation": "HTTP Request",
        "x": 568,
        "y": 256,
        "description": "Fetches the comment history for each ticket task so the workflow can find reply commands.",
        "value": "Retrieves task comments for processing."
      },
      {
        "id": "createOutputRecordsForEveryStoryCommentOnTask",
        "label": "Create Comment Records",
        "type": "Code",
        "icon": "{}",
        "operation": "Code Transform",
        "x": 792,
        "y": 256,
        "description": "Turns task comment data into individual records so each comment can be evaluated on its own.",
        "value": "Normalizes comments into processable rows."
      },
      {
        "id": "ifCommentContainsNotify",
        "label": "If Comment Contains #notify",
        "type": "Condition",
        "icon": "IF",
        "operation": "Conditional Branch",
        "x": 1016,
        "y": 256,
        "description": "Checks whether an Asana comment is marked to send back to the original ticket requester.",
        "value": "Routes notify comments forward and ignores regular internal comments."
      },
      {
        "id": "setCommentText",
        "label": "Set Comment Text",
        "type": "Set",
        "icon": "SET",
        "operation": "Set",
        "x": 1240,
        "y": 160,
        "description": "Prepares the comment text that will become the email reply.",
        "value": "Sets the outbound reply body from the Asana comment."
      },
      {
        "id": "getOriginalTask",
        "label": "Get Original Task",
        "type": "Asana",
        "icon": "AS",
        "operation": "Asana: get",
        "x": 1464,
        "y": 160,
        "description": "Loads the original ticket task so the reply can include the right task context.",
        "value": "Retrieves the Asana task connected to the notify comment."
      },
      {
        "id": "removeNotifyTriggerAndKeepTaskInfo",
        "label": "Clean Reply Text",
        "type": "Code",
        "icon": "{}",
        "operation": "Code Transform",
        "x": 1688,
        "y": 160,
        "description": "Removes the command marker from the comment while keeping the task and reply context needed downstream.",
        "value": "Creates the cleaned outbound message record."
      },
      {
        "id": "checkIfCommentWasPreviouslyProcessed",
        "label": "Check If Comment Was Processed",
        "type": "Data Table",
        "icon": "DB",
        "operation": "Data Table: rowNotExists",
        "x": 1912,
        "y": 160,
        "description": "Checks whether this Asana comment has already sent an email reply so duplicates are avoided.",
        "value": "Continues only for new notify comments."
      },
      {
        "id": "getEmailAssociatedWithTask",
        "label": "Get Linked Email Thread",
        "type": "Data Table",
        "icon": "DB",
        "operation": "Data Table: get",
        "x": 2136,
        "y": 160,
        "description": "Looks up the email thread that belongs to the Asana ticket.",
        "value": "Retrieves the stored ticket-to-email connection."
      },
      {
        "id": "upsertNewlyProcessedComment",
        "label": "Upsert Newly Processed Comment",
        "type": "Data Table",
        "icon": "DB",
        "operation": "Data Table: upsert",
        "x": 2360,
        "y": 160,
        "description": "Stores the processed comment so this exact reply is not sent again on a later run.",
        "value": "Writes or updates the processed-comment tracking row."
      },
      {
        "id": "replyToOriginalEmail",
        "label": "Reply to Original Email",
        "type": "HTTP Request",
        "icon": "API",
        "operation": "HTTP Request",
        "x": 2584,
        "y": 160,
        "description": "Sends the cleaned Asana reply back into the original ticket email thread.",
        "value": "Delivers the staff response to the requester by email."
      }
    ],
    "edges": [
      [
        "scheduleTrigger",
        "getTasksFromProject"
      ],
      [
        "getTasksFromProject",
        "getCommentsFromTasks"
      ],
      [
        "getCommentsFromTasks",
        "createOutputRecordsForEveryStoryCommentOnTask"
      ],
      [
        "createOutputRecordsForEveryStoryCommentOnTask",
        "ifCommentContainsNotify"
      ],
      [
        "ifCommentContainsNotify",
        "setCommentText"
      ],
      [
        "ifCommentContainsNotify",
        "noOperationDoNothing"
      ],
      [
        "setCommentText",
        "getOriginalTask"
      ],
      [
        "getOriginalTask",
        "removeNotifyTriggerAndKeepTaskInfo"
      ],
      [
        "removeNotifyTriggerAndKeepTaskInfo",
        "checkIfCommentWasPreviouslyProcessed"
      ],
      [
        "checkIfCommentWasPreviouslyProcessed",
        "getEmailAssociatedWithTask"
      ],
      [
        "getEmailAssociatedWithTask",
        "upsertNewlyProcessedComment"
      ],
      [
        "upsertNewlyProcessedComment",
        "replyToOriginalEmail"
      ]
    ]
  }
};

workflowData.emailTicketIntake = {
  title: "Create Ticket and Update Original Email Subject",
  status: "Ticket Workflow 4/4",
  summary: "Checks the tech inbox for new ticket requests, creates the Asana task, stores the email tracking records, updates the original email subject, and uploads any attachments to the task.",
  nodes: [
    {
      id: "scheduleTrigger",
      label: "Schedule Trigger",
      type: "Schedule Trigger",
      icon: "CR",
      operation: "Scheduled Trigger",
      x: 120,
      y: 352,
      description: "Runs the email intake workflow on a schedule so new ticket requests can be picked up without a public webhook.",
      value: "Starts the recurring tech inbox check."
    },
    {
      id: "getEmails",
      label: "Get Inbox Emails",
      type: "Microsoft Outlook",
      icon: "MS",
      operation: "Microsoft Outlook: getAll",
      x: 344,
      y: 352,
      description: "Reads recent messages from the tech inbox so the workflow can decide what should become a ticket.",
      value: "Collects candidate ticket request emails."
    },
    {
      id: "ifEmailIsInternalAndDoesntContainReplies",
      label: "Filter New Ticket Emails",
      type: "Condition",
      icon: "IF",
      operation: "Conditional Branch",
      x: 568,
      y: 352,
      description: "Separates new inbound ticket requests from messages that are internal or already part of a reply thread.",
      value: "Routes new ticket emails into the intake branch."
    },
    {
      id: "ifEmailIsRpelyAndTagsTech",
      label: "Check Tagged Reply Email",
      type: "Condition",
      icon: "IF",
      operation: "Conditional Branch",
      x: 792,
      y: 448,
      description: "Checks whether an email reply should still be treated as a tech ticket request.",
      value: "Routes tagged reply emails into the alternate intake branch."
    },
    {
      id: "ifEmailHasNotBeenProcessed",
      label: "Check New Email Not Processed",
      type: "Data Table",
      icon: "DB",
      operation: "Data Table: rowNotExists",
      x: 792,
      y: 160,
      description: "Checks the tracking table so a new ticket email is not processed twice.",
      value: "Continues only for new, untracked email requests."
    },
    {
      id: "wait",
      label: "Wait",
      type: "Wait",
      icon: "WT",
      operation: "Wait Step",
      x: 1000,
      y: 160,
      description: "Adds a short pause before attachment and email lookups continue.",
      value: "Gives the mail system time to return related message data."
    },
    {
      id: "getEmailAttachmentsByID",
      label: "Get New Email Attachments",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 1224,
      y: 160,
      description: "Finds attachment metadata for the new ticket email.",
      value: "Prepares attachment names for the Asana ticket."
    },
    {
      id: "collectFileNames",
      label: "Collect File Names",
      type: "Code",
      icon: "{}",
      operation: "Code Transform",
      x: 1448,
      y: 160,
      description: "Builds a clean list of attachment names that can be referenced in the task.",
      value: "Turns attachment metadata into readable task context."
    },
    {
      id: "getFullEmailByConversationIDInTextFormat",
      label: "Get New Email Text",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 1672,
      y: 160,
      description: "Retrieves the full email content in a safer text format for task creation.",
      value: "Provides the source email body for the ticket."
    },
    {
      id: "getEmailBodyAndCleanFileNamesToReferenceInTask",
      label: "Clean New Email Body",
      type: "Code",
      icon: "{}",
      operation: "Code Transform",
      x: 1896,
      y: 160,
      description: "Cleans the email body and combines it with attachment references for the Asana task.",
      value: "Creates the task-ready ticket description."
    },
    {
      id: "createTaskWithDetailsFromEmail",
      label: "Create Asana Ticket",
      type: "Asana",
      icon: "AS",
      operation: "Asana",
      x: 2120,
      y: 160,
      description: "Creates the Asana task from the cleaned email request.",
      value: "Turns the inbound email into a ticket task."
    },
    {
      id: "pUTConversationIDAndEmailIDIntoTaskFields",
      label: "Save Email IDs To Task",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 2344,
      y: 160,
      description: "Adds email tracking references to the new Asana task so later workflows can find the thread.",
      value: "Links the created task back to the source email thread."
    },
    {
      id: "insertRowIntoEmailThreadsStarted",
      label: "Track Started Thread",
      type: "Data Table",
      icon: "DB",
      operation: "Data Table",
      x: 2568,
      y: 160,
      description: "Creates a tracking row for the email thread that now belongs to the Asana ticket.",
      value: "Records the task-to-email relationship."
    },
    {
      id: "upsertRowSIntoTechEmailsCreated",
      label: "Track Created Ticket Email",
      type: "Data Table",
      icon: "DB",
      operation: "Data Table: upsert",
      x: 2792,
      y: 160,
      description: "Records that the inbound email has already generated a ticket.",
      value: "Prevents the same email from creating duplicate tasks."
    },
    {
      id: "sendReplyToOriginalEmailAndUpdateSubject",
      label: "Reply and Update Subject",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 3016,
      y: 160,
      description: "Replies to the original requester and updates the email subject so the ticket relationship is visible.",
      value: "Confirms the ticket was created and keeps the thread identifiable."
    },
    {
      id: "upsertRowSIntoEmailThreadsStarted",
      label: "Save Updated Thread",
      type: "Data Table",
      icon: "DB",
      operation: "Data Table: upsert",
      x: 3240,
      y: 160,
      description: "Updates the thread tracking record after the subject/reply step completes.",
      value: "Keeps the stored thread data current."
    },
    {
      id: "getEmailAttachments",
      label: "Get Attachments For Upload",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 3464,
      y: 160,
      description: "Downloads the attachments that should be copied to the Asana task.",
      value: "Collects files for the ticket record."
    },
    {
      id: "convertImagesToBinary",
      label: "Convert Attachments",
      type: "Code",
      icon: "{}",
      operation: "Code Transform",
      x: 3688,
      y: 160,
      description: "Converts attachment data into the format needed for upload.",
      value: "Prepares email files for Asana attachment upload."
    },
    {
      id: "pOSTEmailAttachmentsToAsanaTask",
      label: "Upload Attachments To Asana",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 3912,
      y: 160,
      description: "Uploads the email attachments onto the Asana ticket.",
      value: "Keeps request files with the created task."
    },
    {
      id: "ifEmailHasNotBeenProcessed2",
      label: "Check Tagged Email Not Processed",
      type: "Data Table",
      icon: "DB",
      operation: "Data Table: rowNotExists",
      x: 1224,
      y: 352,
      description: "Checks the tracking table before processing a tagged reply as a ticket request.",
      value: "Continues only for tagged emails that have not already created a task."
    },
    {
      id: "getEmailAttachmentsByID2",
      label: "Get Tagged Email Attachments",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 1448,
      y: 352,
      description: "Finds attachment metadata for the tagged reply branch.",
      value: "Prepares attachment names for the alternate ticket path."
    },
    {
      id: "collectFileNames2",
      label: "Collect Tagged File Names",
      type: "Code",
      icon: "{}",
      operation: "Code Transform",
      x: 1672,
      y: 352,
      description: "Builds a readable attachment list for the tagged reply branch.",
      value: "Turns tagged email attachments into task context."
    },
    {
      id: "getFullEmailByConversationIDInTextFormat2",
      label: "Get Tagged Email Text",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 1896,
      y: 352,
      description: "Retrieves the full tagged email content in text form.",
      value: "Provides the source email body for the alternate ticket path."
    },
    {
      id: "getEmailBodyAndCleanFileNamesToReferenceInTask2",
      label: "Clean Tagged Email Body",
      type: "Code",
      icon: "{}",
      operation: "Code Transform",
      x: 2120,
      y: 352,
      description: "Cleans the tagged email content and attaches readable file references.",
      value: "Creates the task-ready description for the tagged email path."
    },
    {
      id: "createTaskWithDetailsFromEmail2",
      label: "Create Tagged Email Ticket",
      type: "Asana",
      icon: "AS",
      operation: "Asana",
      x: 2344,
      y: 352,
      description: "Creates an Asana ticket from a tagged email reply.",
      value: "Turns the tagged email into a ticket task."
    },
    {
      id: "pUTConversationIDAndEmailIDIntoTaskFields2",
      label: "Save Tagged Email IDs",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 2568,
      y: 352,
      description: "Stores email tracking references on the Asana task created from the tagged branch.",
      value: "Links the tagged email task back to its source thread."
    },
    {
      id: "insertRowIntoEmailThreadsStarted2",
      label: "Track Tagged Thread",
      type: "Data Table",
      icon: "DB",
      operation: "Data Table",
      x: 2792,
      y: 352,
      description: "Creates the initial thread tracking record for the tagged branch.",
      value: "Records the tagged task-to-email relationship."
    },
    {
      id: "upsertRowSIntoTechEmailsCreated2",
      label: "Track Tagged Ticket Email",
      type: "Data Table",
      icon: "DB",
      operation: "Data Table: upsert",
      x: 3016,
      y: 352,
      description: "Records that the tagged email has already produced a ticket.",
      value: "Prevents duplicate tickets from the same tagged email."
    },
    {
      id: "sendReplyToOriginalEmailAndUpdateSubject2",
      label: "Reply and Update Tagged Subject",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 3240,
      y: 352,
      description: "Replies to the requester and updates the subject for the tagged email branch.",
      value: "Confirms ticket creation and keeps the thread identifiable."
    },
    {
      id: "upsertRowSIntoEmailThreadsStarted2",
      label: "Save Tagged Thread Update",
      type: "Data Table",
      icon: "DB",
      operation: "Data Table: upsert",
      x: 3464,
      y: 352,
      description: "Updates the stored thread record after the tagged subject/reply step completes.",
      value: "Keeps tagged branch thread tracking current."
    },
    {
      id: "getEmailAttachments2",
      label: "Get Tagged Attachments",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 3688,
      y: 352,
      description: "Downloads attachments from the tagged email branch for upload.",
      value: "Collects files for the tagged ticket task."
    },
    {
      id: "convertImagesToBinary2",
      label: "Convert Tagged Attachments",
      type: "Code",
      icon: "{}",
      operation: "Code Transform",
      x: 3912,
      y: 352,
      description: "Converts tagged branch attachments into the upload-ready format.",
      value: "Prepares tagged email files for Asana upload."
    },
    {
      id: "pOSTEmailAttachmentsToAsanaTask2",
      label: "Upload Tagged Attachments",
      type: "HTTP Request",
      icon: "API",
      operation: "HTTP Request",
      x: 4136,
      y: 352,
      description: "Uploads tagged email attachments onto the Asana ticket.",
      value: "Keeps tagged request files with the created task."
    },
    {
      id: "noOperationDoNothing",
      label: "No Operation",
      type: "No Operation",
      icon: ">>",
      operation: "No Operation",
      x: 1016,
      y: 544,
      description: "Stops the branch when the email should not create a new ticket.",
      value: "Ends ignored messages cleanly."
    }
  ],
  edges: [
    ["scheduleTrigger", "getEmails"],
    ["getEmails", "ifEmailIsInternalAndDoesntContainReplies"],
    ["ifEmailIsInternalAndDoesntContainReplies", "ifEmailHasNotBeenProcessed"],
    ["ifEmailIsInternalAndDoesntContainReplies", "ifEmailIsRpelyAndTagsTech"],
    ["ifEmailHasNotBeenProcessed", "wait"],
    ["wait", "getEmailAttachmentsByID"],
    ["getEmailAttachmentsByID", "collectFileNames"],
    ["collectFileNames", "getFullEmailByConversationIDInTextFormat"],
    ["getFullEmailByConversationIDInTextFormat", "getEmailBodyAndCleanFileNamesToReferenceInTask"],
    ["getEmailBodyAndCleanFileNamesToReferenceInTask", "createTaskWithDetailsFromEmail"],
    ["createTaskWithDetailsFromEmail", "pUTConversationIDAndEmailIDIntoTaskFields"],
    ["pUTConversationIDAndEmailIDIntoTaskFields", "insertRowIntoEmailThreadsStarted"],
    ["insertRowIntoEmailThreadsStarted", "upsertRowSIntoTechEmailsCreated"],
    ["upsertRowSIntoTechEmailsCreated", "sendReplyToOriginalEmailAndUpdateSubject"],
    ["sendReplyToOriginalEmailAndUpdateSubject", "upsertRowSIntoEmailThreadsStarted"],
    ["upsertRowSIntoEmailThreadsStarted", "getEmailAttachments"],
    ["getEmailAttachments", "convertImagesToBinary"],
    ["convertImagesToBinary", "pOSTEmailAttachmentsToAsanaTask"],
    ["ifEmailIsRpelyAndTagsTech", "ifEmailHasNotBeenProcessed2"],
    ["ifEmailIsRpelyAndTagsTech", "noOperationDoNothing"],
    ["ifEmailHasNotBeenProcessed2", "getEmailAttachmentsByID2"],
    ["getEmailAttachmentsByID2", "collectFileNames2"],
    ["collectFileNames2", "getFullEmailByConversationIDInTextFormat2"],
    ["getFullEmailByConversationIDInTextFormat2", "getEmailBodyAndCleanFileNamesToReferenceInTask2"],
    ["getEmailBodyAndCleanFileNamesToReferenceInTask2", "createTaskWithDetailsFromEmail2"],
    ["createTaskWithDetailsFromEmail2", "pUTConversationIDAndEmailIDIntoTaskFields2"],
    ["pUTConversationIDAndEmailIDIntoTaskFields2", "insertRowIntoEmailThreadsStarted2"],
    ["insertRowIntoEmailThreadsStarted2", "upsertRowSIntoTechEmailsCreated2"],
    ["upsertRowSIntoTechEmailsCreated2", "sendReplyToOriginalEmailAndUpdateSubject2"],
    ["sendReplyToOriginalEmailAndUpdateSubject2", "upsertRowSIntoEmailThreadsStarted2"],
    ["upsertRowSIntoEmailThreadsStarted2", "getEmailAttachments2"],
    ["getEmailAttachments2", "convertImagesToBinary2"],
    ["convertImagesToBinary2", "pOSTEmailAttachmentsToAsanaTask2"]
  ]
};

const viewer = document.querySelector("[data-workflow-viewer]");
const workflowView = {
  scale: 1,
  x: 0,
  y: 0,
  spaceDown: false,
  dragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
  suppressClick: false,
  running: false,
  activePointers: new Map(),
  pinchDistance: 0,
  pinchScale: 1,
  beforeFullscreenScrollX: 0,
  beforeFullscreenScrollY: 0,
  shouldRestoreScroll: false
};
let activeWorkflowId = "startTicketThread";
const workflowNodeWidth = 178;
const workflowNodeHeight = 132;
const workflowIconSize = 72;
const workflowIconOffsetX = (workflowNodeWidth - workflowIconSize) / 2;
const workflowPortY = workflowIconSize / 2;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function updateWorkflowTransform() {
  if (!viewer) return;

  const board = viewer.querySelector("[data-workflow-board]");
  board.style.transform = `translate(${workflowView.x}px, ${workflowView.y}px) scale(${workflowView.scale})`;
}

function resetWorkflowView() {
  const view = workflowData[activeWorkflowId]?.view || {};
  workflowView.scale = view.scale || 1;
  workflowView.x = view.x || 0;
  workflowView.y = view.y || 0;
  updateWorkflowTransform();
}

function getWorkflowBounds(workflow) {
  const nodeElements = viewer ? [...viewer.querySelectorAll(".workflow-node")] : [];

  if (nodeElements.length) {
    const boxes = nodeElements.map((element) => {
      const node = workflow.nodes.find((item) => item.id === element.dataset.nodeId);
      return {
        minX: node?.x || 0,
        minY: node?.y || 0,
        maxX: (node?.x || 0) + element.offsetWidth,
        maxY: (node?.y || 0) + element.offsetHeight
      };
    });

    const minX = Math.min(...boxes.map((box) => box.minX));
    const minY = Math.min(...boxes.map((box) => box.minY));
    const maxX = Math.max(...boxes.map((box) => box.maxX));
    const maxY = Math.max(...boxes.map((box) => box.maxY));

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  const xs = workflow.nodes.map((node) => node.x);
  const ys = workflow.nodes.map((node) => node.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs) + workflowNodeWidth;
  const maxY = Math.max(...ys) + workflowNodeHeight;

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function getWorkflowBoardSize(workflow) {
  const maxX = Math.max(...workflow.nodes.map((node) => node.x)) + workflowNodeWidth + 260;
  const maxY = Math.max(...workflow.nodes.map((node) => node.y)) + workflowNodeHeight + 260;

  return {
    width: Math.max(3300, maxX),
    height: Math.max(1100, maxY)
  };
}

function setWorkflowScale(nextScale, originX, originY) {
  const clampedScale = Math.min(1.5, Math.max(0.1, nextScale));
  const worldX = (originX - workflowView.x) / workflowView.scale;
  const worldY = (originY - workflowView.y) / workflowView.scale;

  workflowView.scale = clampedScale;
  workflowView.x = originX - worldX * clampedScale;
  workflowView.y = originY - worldY * clampedScale;
  updateWorkflowTransform();
}

function fitWorkflowView() {
  if (!viewer) return;

  const workflow = workflowData[activeWorkflowId];
  const canvas = viewer.querySelector("[data-workflow-canvas]");
  if (!workflow?.nodes.length || !canvas) return;

  const bounds = getWorkflowBounds(workflow);
  const horizontalPadding = 40;
  const verticalPadding = 72;
  const controlsSafeArea = 96;
  const availableWidth = Math.max(1, canvas.clientWidth - horizontalPadding * 2);
  const availableHeight = Math.max(1, canvas.clientHeight - verticalPadding * 2 - controlsSafeArea);
  const widthScale = availableWidth / bounds.width;
  const heightScale = availableHeight / bounds.height;
  const nextScale = Math.min(1.05, Math.max(0.1, Math.min(widthScale, heightScale)));

  workflowView.scale = nextScale;
  workflowView.x = (canvas.clientWidth - bounds.width * nextScale) / 2 - bounds.minX * nextScale;
  workflowView.y = (canvas.clientHeight - controlsSafeArea - bounds.height * nextScale) / 2 - bounds.minY * nextScale;
  updateWorkflowTransform();
}

function renderWorkflow(workflowId) {
  if (!viewer || !workflowData[workflowId]) return;

  const workflow = workflowData[workflowId];
  activeWorkflowId = workflowId;
  const canvas = viewer.querySelector("[data-workflow-canvas]");
  const board = viewer.querySelector("[data-workflow-board]");
  const lines = viewer.querySelector("[data-workflow-lines]");
  const title = viewer.querySelector("[data-workflow-title]");
  const summary = viewer.querySelector("[data-workflow-summary]");
  const status = viewer.querySelector("[data-workflow-status]");

  title.textContent = workflow.title;
  summary.textContent = workflow.summary;
  status.textContent = workflow.status;
  const boardSize = getWorkflowBoardSize(workflow);
  board.style.width = `${boardSize.width}px`;
  board.style.height = `${boardSize.height}px`;
  lines.setAttribute("width", boardSize.width);
  lines.setAttribute("height", boardSize.height);
  board.querySelectorAll(".workflow-node").forEach((node) => node.remove());
  lines.innerHTML = "";

  const nodeMap = new Map(workflow.nodes.map((node) => [node.id, node]));

  workflow.edges.forEach(([fromId, toId]) => {
    const from = nodeMap.get(fromId);
    const to = nodeMap.get(toId);
    if (!from || !to) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const startX = from.x + workflowIconOffsetX + workflowIconSize;
    const startY = from.y + workflowPortY;
    const endX = to.x + workflowIconOffsetX;
    const endY = to.y + workflowPortY;
    const midX = startX + Math.max(44, (endX - startX) / 2);
    line.setAttribute("d", `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`);
    line.setAttribute("fill", "none");
    line.classList.add("workflow-edge");
    line.dataset.from = fromId;
    line.dataset.to = toId;
    lines.appendChild(line);
  });

  workflow.nodes.forEach((node, index) => {
    const button = document.createElement("button");
    button.className = "workflow-node";
    button.type = "button";
    button.style.left = `${node.x}px`;
    button.style.top = `${node.y}px`;
    button.dataset.nodeId = node.id;
    button.innerHTML = `
      <i class="workflow-port workflow-port-in"></i>
      <i class="workflow-port workflow-port-out"></i>
      <span class="workflow-node-icon">${node.icon}</span>
      <span class="workflow-node-copy">
        <span>${node.operation}</span>
        <strong>${node.label}</strong>
      </span>
    `;
    button.addEventListener("click", () => selectWorkflowNode(workflowId, node.id));
    board.appendChild(button);

    if (index === 0) {
      selectWorkflowNode(workflowId, node.id);
    }
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (workflow.view) {
        resetWorkflowView();
      } else {
        fitWorkflowView();
      }
    });
  });
}

function selectWorkflowNode(workflowId, nodeId) {
  if (!viewer) return;

  const workflow = workflowData[workflowId];
  const node = workflow?.nodes.find((item) => item.id === nodeId);
  if (!node) return;

  viewer.querySelectorAll(".workflow-node").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.nodeId === nodeId);
  });

  viewer.querySelector("[data-node-title]").textContent = node.label;
  viewer.querySelector("[data-node-description]").textContent = node.description;
  viewer.querySelector("[data-node-type]").textContent = node.type;
  viewer.querySelector("[data-node-value]").textContent = node.value;
}

function getWorkflowRunOrder(workflow) {
  const incoming = new Map(workflow.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(workflow.nodes.map((node) => [node.id, []]));

  workflow.edges.forEach(([from, to]) => {
    incoming.set(to, (incoming.get(to) || 0) + 1);
    outgoing.get(from)?.push(to);
  });

  const start = workflow.nodes.find((node) => incoming.get(node.id) === 0) || workflow.nodes[0];
  const order = [];
  const visited = new Set();
  const queue = [start.id];

  while (queue.length) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    order.push(nodeId);
    outgoing.get(nodeId)?.forEach((nextId) => queue.push(nextId));
  }

  workflow.nodes.forEach((node) => {
    if (!visited.has(node.id)) order.push(node.id);
  });

  return order;
}

async function runWorkflowDemo() {
  if (!viewer || workflowView.running) return;

  const workflow = workflowData[activeWorkflowId];
  const runButton = viewer.querySelector("[data-workflow-run]");
  const status = viewer.querySelector("[data-workflow-status]");
  if (!workflow) return;

  workflowView.running = true;
  runButton.disabled = true;
  runButton.textContent = "Running";
  status.textContent = `${workflow.status}: demo running`;

  viewer.querySelectorAll(".workflow-node").forEach((node) => {
    node.classList.remove("is-executing", "is-complete");
  });
  viewer.querySelectorAll(".workflow-edge").forEach((edge) => {
    edge.classList.remove("is-active");
  });

  const order = getWorkflowRunOrder(workflow);

  for (let index = 0; index < order.length; index += 1) {
    const nodeId = order[index];
    const nodeButton = viewer.querySelector(`.workflow-node[data-node-id="${nodeId}"]`);
    selectWorkflowNode(activeWorkflowId, nodeId);
    nodeButton?.classList.add("is-executing");
    await wait(650);
    nodeButton?.classList.remove("is-executing");
    nodeButton?.classList.add("is-complete");

    const nextId = order[index + 1];
    const edge = viewer.querySelector(`.workflow-edge[data-from="${nodeId}"][data-to="${nextId}"]`);
    if (edge) {
      edge.classList.add("is-active");
      await wait(320);
    }
  }

  runButton.textContent = "Execute Demo";
  runButton.disabled = false;
  status.textContent = `${workflow.status}: demo complete`;
  workflowView.running = false;
}

async function toggleWorkflowFullscreen() {
  if (!viewer || !document.fullscreenEnabled) return;

  if (document.fullscreenElement === viewer) {
    workflowView.shouldRestoreScroll = true;
    await document.exitFullscreen();
    return;
  }

  workflowView.beforeFullscreenScrollX = window.scrollX;
  workflowView.beforeFullscreenScrollY = window.scrollY;
  workflowView.shouldRestoreScroll = false;
  await viewer.requestFullscreen();
}

function updateWorkflowFullscreenButton() {
  if (!viewer) return;

  const fullscreen = viewer.querySelector("[data-workflow-fullscreen]");
  if (!fullscreen) return;

  const isFullscreen = document.fullscreenElement === viewer;
  fullscreen.textContent = isFullscreen ? "Exit" : "Fullscreen";
  fullscreen.setAttribute("aria-label", isFullscreen ? "Exit workflow fullscreen" : "View workflow fullscreen");
}

function restoreWorkflowScrollPosition() {
  if (!workflowView.shouldRestoreScroll || document.fullscreenElement === viewer) return;

  workflowView.shouldRestoreScroll = false;
  const originalScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";

  const restore = () => {
    window.scrollTo({
      left: workflowView.beforeFullscreenScrollX,
      top: workflowView.beforeFullscreenScrollY,
      behavior: "instant"
    });
  };

  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(() => {
      restore();
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    });
  });
}

if (viewer) {
  const canvas = viewer.querySelector("[data-workflow-canvas]");
  const fit = viewer.querySelector("[data-workflow-fit]");
  const fullscreen = viewer.querySelector("[data-workflow-fullscreen]");
  const zoomIn = viewer.querySelector("[data-workflow-zoom-in]");
  const zoomOut = viewer.querySelector("[data-workflow-zoom-out]");
  const run = viewer.querySelector("[data-workflow-run]");

  viewer.querySelectorAll("[data-workflow-id]").forEach((tab) => {
    tab.addEventListener("click", () => {
      viewer.querySelectorAll("[data-workflow-id]").forEach((item) => {
        item.classList.toggle("is-active", item === tab);
      });
      renderWorkflow(tab.dataset.workflowId);
    });
  });

  zoomIn?.addEventListener("click", () => {
    setWorkflowScale(workflowView.scale + 0.1, canvas.clientWidth / 2, canvas.clientHeight / 2);
  });
  zoomOut?.addEventListener("click", () => {
    setWorkflowScale(workflowView.scale - 0.1, canvas.clientWidth / 2, canvas.clientHeight / 2);
  });
  fit?.addEventListener("click", fitWorkflowView);
  fullscreen?.addEventListener("click", toggleWorkflowFullscreen);
  run?.addEventListener("click", runWorkflowDemo);
  document.addEventListener("fullscreenchange", () => {
    updateWorkflowFullscreenButton();
    fitWorkflowView();
    fullscreen?.blur();
    restoreWorkflowScrollPosition();
  });

  window.addEventListener("keydown", (event) => {
    if (event.code !== "Space") return;
    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
    event.preventDefault();
    if (workflowView.spaceDown) return;
    workflowView.spaceDown = true;
    canvas.classList.add("is-panning");
  });

  window.addEventListener("keyup", (event) => {
    if (event.code !== "Space") return;
    event.preventDefault();
    workflowView.spaceDown = false;
    workflowView.dragging = false;
    workflowView.activePointers.clear();
    canvas.classList.remove("is-panning", "is-dragging");
  });

  function getTouchPointers() {
    return [...workflowView.activePointers.values()].filter((pointer) => pointer.pointerType === "touch");
  }

  function getPointerDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function getPointerMidpoint(first, second) {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2
    };
  }

  function startWorkflowDrag(event) {
    workflowView.dragging = true;
    workflowView.startX = event.clientX;
    workflowView.startY = event.clientY;
    workflowView.originX = workflowView.x;
    workflowView.originY = workflowView.y;
    canvas.classList.add("is-dragging");
  }

  function updateWorkflowDrag(event) {
    const deltaX = event.clientX - workflowView.startX;
    const deltaY = event.clientY - workflowView.startY;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      workflowView.suppressClick = true;
    }
    workflowView.x = workflowView.originX + deltaX;
    workflowView.y = workflowView.originY + deltaY;
    updateWorkflowTransform();
  }

  function startWorkflowPinch(touches) {
    workflowView.dragging = false;
    workflowView.pinchDistance = getPointerDistance(touches[0], touches[1]);
    workflowView.pinchScale = workflowView.scale;
    canvas.classList.add("is-dragging");
  }

  function updateWorkflowPinch(touches) {
    const nextDistance = getPointerDistance(touches[0], touches[1]);
    if (!workflowView.pinchDistance || !nextDistance) return;

    const midpoint = getPointerMidpoint(touches[0], touches[1]);
    const rect = canvas.getBoundingClientRect();
    const nextScale = workflowView.pinchScale * (nextDistance / workflowView.pinchDistance);
    workflowView.suppressClick = true;
    setWorkflowScale(nextScale, midpoint.x - rect.left, midpoint.y - rect.top);
  }

  canvas.addEventListener("pointerdown", (event) => {
    const isTouch = event.pointerType === "touch";
    const isCanvasControl = event.target.closest(".workflow-controls, .workflow-canvas-fullscreen");
    if (isCanvasControl || (!isTouch && !workflowView.spaceDown)) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    workflowView.activePointers.set(event.pointerId, {
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY
    });

    const touches = getTouchPointers();
    if (touches.length >= 2) {
      startWorkflowPinch(touches);
      return;
    }

    startWorkflowDrag(event);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!workflowView.dragging && workflowView.activePointers.size === 0) return;
    event.preventDefault();
    if (workflowView.activePointers.has(event.pointerId)) {
      workflowView.activePointers.set(event.pointerId, {
        pointerType: event.pointerType,
        x: event.clientX,
        y: event.clientY
      });
    }

    const touches = getTouchPointers();
    if (touches.length >= 2) {
      updateWorkflowPinch(touches);
      return;
    }

    if (workflowView.dragging) {
      updateWorkflowDrag(event);
    }
  });

  function endWorkflowPointer(event) {
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    workflowView.activePointers.delete(event.pointerId);
    const touches = getTouchPointers();

    if (touches.length === 1) {
      workflowView.startX = touches[0].x;
      workflowView.startY = touches[0].y;
      workflowView.originX = workflowView.x;
      workflowView.originY = workflowView.y;
      workflowView.dragging = true;
      return;
    }

    if (touches.length === 0) {
      workflowView.dragging = false;
      workflowView.pinchDistance = 0;
      canvas.classList.remove("is-dragging");
    }
  }

  canvas.addEventListener("pointerup", endWorkflowPointer);
  canvas.addEventListener("pointercancel", endWorkflowPointer);

  canvas.addEventListener("click", (event) => {
    if (!workflowView.suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    workflowView.suppressClick = false;
  }, true);

  canvas.addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const nextScale = workflowView.scale + (event.deltaY > 0 ? -0.05 : 0.05);
    const rect = canvas.getBoundingClientRect();
    setWorkflowScale(nextScale, event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });

  renderWorkflow("startTicketThread");
  updateWorkflowFullscreenButton();
}
