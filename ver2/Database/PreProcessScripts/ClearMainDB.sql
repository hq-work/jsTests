-- Portal Dashboards
DELETE FROM [PageGroup]
DELETE FROM [PanelTemplate]

--Packages and Main Menu
DELETE FROM MainMenuItem WHERE PackageID IS NOT NULL
DELETE FROM Package

DELETE FROM [Message]

-- Dashboard
DELETE FROM DashboardUserMap

--Reports
DELETE FROM [ReportCurrentUserAccess]
DELETE FROM [ReportUserAccessLevel]
DELETE FROM [ReportGroupAccessLevel]
DELETE FROM [ReportVersion]

DELETE FROM [Report]
WHERE ID NOT IN (
	SELECT ID FROM System 
	UNION 
	SELECT r.ID FROM Report r
		INNER JOIN ReportTreeStructure t ON r.ID=t.ReportID AND t.Level=1
		INNER JOIN [System] s ON s.ID = t.ParentReportID
		WHERE r.IsFolder=1 AND r.IsCustom=1)

DELETE FROM [ReportScheduleNotificationUser]
DELETE FROM [ReportSchedule]



-- Tasks
DELETE FROM WorkflowInstanceTask

DELETE FROM TaskNotificationGroup
DELETE FROM TaskNotificationUser
DELETE FROM TaskNotification
DELETE FROM TaskWorkflowTriggerGroup
DELETE FROM TaskWorkflowTriggerUser
DELETE FROM TaskWorkflowTrigger
DELETE FROM UserTask
DELETE FROM GroupTask
DELETE FROM TaskObject
DELETE FROM TaskStatus
DELETE FROM TaskEventInstance
DELETE FROM TaskSchedule
DELETE FROM TaskHistory
DELETE FROM Task

DELETE FROM TaskTemplateNotificationGroup
DELETE FROM TaskTemplateNotificationUser
DELETE FROM TaskTemplateNotification
DELETE FROM TaskTemplateWorkflowTriggerUser
DELETE FROM TaskTemplateWorkflowTriggerGroup
DELETE FROM TaskTemplateWorkflowTrigger


-- Workflow
DELETE FROM WorkflowInstanceTreeStructure
DELETE FROM WorkflowInstance

UPDATE WorkflowPolicyNotification
SET
	CompletionStepName = '',
	NotCompletionStepName = '',
	AssignmentStepName = ''

DELETE FROM WorkflowDefinitionVersionRoleFieldPermission
DELETE FROM WorkflowDefinitionVersionRoleStepPermission
DELETE FROM WorkflowDefinitionVersionRoleToInitiatorMap
DELETE FROM WorkflowDefinitionVersionRoleToStepActionMap
DELETE FROM WorkflowDefinitionVersionStepToActionMap
DELETE FROM WorkflowDefinitionVersionStepAction
DELETE FROM WorkflowDefinitionVersionStep
DELETE FROM WorkflowDefinitionVersionRole
DELETE FROM WorkflowDefinitionVersion
DELETE FROM WorkflowDefinition

DELETE FROM FormTemplate

DELETE FROM UdfValue

DELETE FROM WorkflowPolicy
DELETE FROM NotificationTemplate
DELETE FROM WorkflowRole WHERE IsPredefined = 0

-- Dashboards
DELETE FROM SystemDashboardCurrentAccessLevel;
DELETE FROM SystemDashboardGroupAccessLevel;
DELETE FROM SystemDashboardUserAccessLevel;

DELETE FROM DashboardPanel;
DELETE FROM DashboardPanelType WHERE Name NOT IN ('Calendar','Data Metrics','Messages','Tasks','Data Warnings','My Quick Links','Workflows','Shared Quick Links','Custom Searches');
DELETE FROM UserDashboardShares;

DELETE FROM SystemDashboard WHERE ID NOT IN (SELECT TOP 1 ID FROM [System]);
DELETE FROM DashboardConfiguration WHERE ID NOT IN (SELECT TOP 1 ID FROM [System]);
-- END (for Dashboards)

-- Citations
DELETE FROM [CitationAssociationHistory]
DELETE FROM [CitationVersionToObjectMap]
DELETE FROM [CitationVersion]
DELETE FROM [Citation] WHERE ID NOT IN (SELECT TOP 1 ID FROM [System])
DELETE FROM [DeletedIssueAgency]
DELETE FROM [IssueAgency]
DELETE FROM CitationCurrentAccessLevel
DELETE FROM CitationUserAccessLevel


-- Documents
DELETE FROM [DocumentVersion]
DELETE FROM [Document] WHERE ID NOT IN (SELECT TOP 1 ID FROM [System])

DELETE FROM EffectivePermission
DELETE FROM UserAccessLevel

DELETE FROM [Group] WHERE [Name] <> 'Administrators'
DELETE FROM [GroupMembership]

DELETE FROM MaterialScriptDependency
DELETE FROM [MACReqToMaterialMap]
DELETE FROM [MaterialValueHistory]

DELETE FROM [MaterialData]
DELETE FROM [MaterialDataLine]
DELETE FROM [MDLGroup]

-- Async Worker
DELETE FROM WorkerCommandLog
DELETE FROM WorkerCommandLogDetail
DELETE FROM IncomingMessage
DELETE FROM ReportExecuteLog
DELETE FROM ReportCachedResult

DECLARE c CURSOR
FOR SELECT conversation_handle from sys.conversation_endpoints

DECLARE @h uniqueidentifier 
     
OPEN c

FETCH NEXT FROM c INTO @h
WHILE (@@fetch_status <> -1)
BEGIN
	IF (@@fetch_status <> -2)
	BEGIN
		END CONVERSATION @h WITH CLEANUP 
	END
	FETCH NEXT FROM c INTO @h
END

CLOSE c
DEALLOCATE c

-- Command Log Entry --
DELETE FROM CommandLog

-- Compliance Objects
DELETE FROM ComplianceObject WHERE ID NOT IN (SELECT TOP 1 ID FROM [System])

DELETE FROM UserRights
DELETE FROM [User]
FROM [User] U
WHERE NOT EXISTS (SELECT 1 FROM [System] S WHERE S.OwnerID = U.[ID])

DELETE FROM ActivityUDFDataToUDFItemMap
DELETE FROM ActivityUDFData
DELETE FROM ActivityToPropertyMap
DELETE FROM Activity

DELETE FROM EventTemplateToUdfMap
DELETE FROM EventTemplate

DELETE FROM RequirementTemplate
DELETE FROM TaskTemplate
DELETE FROM QualityTemplate
DELETE FROM UdfTemplateToUdfMap
DELETE FROM UDFTemplate

DELETE FROM [MaterialUDFData]
DELETE FROM [MaterialUDFDataToUDFItemMap]
DELETE FROM [MaterialTemplateToUDFMap]

--CalcTemplates
DELETE FROM CalcTemplateToUdfMap
DELETE FROM CalcTemplate

DELETE FROM UDFDependency
DELETE FROM Udf WHERE IsPredefined = 0

-- Messages
DELETE FROM MessageQueue

-- Material Group
DELETE FROM [MaterialGroupToMaterialMap]
DELETE FROM [MaterialGroup]

--Material Property
DELETE FROM [MaterialToPropertyMap]
DELETE FROM [MaterialProperty]

-- Chemical
DELETE FROM [ChemicalListToChemical]
DELETE FROM [ChemicalListHistory]
DELETE FROM [ChemicalList]
DELETE FROM [ChemicalGroupToChemical]
DELETE FROM [ChemicalGroup]
DELETE FROM [MaterialScriptDependency]
DELETE FROM [ChemicalToFieldMap]
DELETE FROM [ChemicalHistory] 
DELETE FROM [ChemicalConcentrationHistory]
DELETE FROM [MaterialToChemicalMap]
DELETE FROM [MaterialFormulaHistory]
DELETE FROM [Chemical]
DELETE FROM [Material]
DELETE FROM [MaterialTemplate]
DELETE FROM [ComplianceLocationHistory]

IF NOT EXISTS(SELECT r.ID FROM Report r
		INNER JOIN ReportTreeStructure t ON r.ID=t.ReportID AND t.Level=1
		INNER JOIN [System] s ON s.ID = t.ParentReportID
		WHERE r.IsFolder=1 AND r.IsCustom=1)
begin

declare @parent uniqueidentifier
declare @newid uniqueidentifier
set @parent = (SELECT ID FROM System)
set @newid = newID()

INSERT INTO [Report]
           ([ID]
           ,[Name]
           ,[Description]
           ,[IsFolder]
           ,[Type]
           ,[Created]
           ,[IsCustom])
     VALUES
           (@newid
           ,'Custom Reports'
           ,'Custom Reports'
           ,1
           ,0
           ,getutcdate()
           ,1)

INSERT INTO [ReportTreeStructure]
           ([ReportID]
           ,[ParentReportID]
           ,[Level])
     VALUES
           (@newid
           ,@newid
           ,0)
           
INSERT INTO [ReportTreeStructure]
           ([ReportID]
           ,[ParentReportID]
           ,[Level])
     VALUES
           (@newid
           ,@parent
           ,1)

UPDATE [System]
SET TemplateSystemDashboardID = NULL

end

-- Quick Links
DELETE FROM UserQuickLink
DELETE FROM SystemQuickLink
DELETE FROM QuickLinkConfiguration
DELETE FROM SystemQuickLinkDistributionUser
DELETE FROM SystemQuickLinkCurrentDistributionUser
DELETE FROM SystemQuickLinkDistributionGroup
DELETE FROM QuickLinkPageFlow WHERE Name NOT IN ('Search Activities', 'Search Applicable Requirements', 'View Cached Report', 'Search Calculation Templates', 'Object Calendar', 'Search Chemical Groups', 'Search Chemical Lists', 'Search Chemicals', 'Search Citations', 'Search Command Log', 'Search Custom Field Library', 'Search Custom Field Templates', 'Search Data Quality Templates', 'Search Data Warnings', 'Search Documents', 'Search Enviance Apps', 'Enter-Edit Event Data', 'Quick Add Event Data', 'View Event Data', 'Search Event Templates', 'Search Form Templates', 'Search Inbox', 'Search Material/Activity Field Library', 'Search Material/Activity Templates', 'Search Material Groups', 'Search Materials', 'Search Meteorological Data', 'Enter-Edit Non-Numeric Data', 'View Non-Numeric Data', 'Search Notification Templates', 'Enter-Edit Numeric Data', 'Quick Add Numeric Data', 'View Numeric Data', 'Search Regulatory Notice Request Log', 'Search Regulatory Notices', 'Search Reports', 'Search Requirement Templates', 'Search System Dashboards', 'Search System Quick Links', 'Create Task', 'Search Tasks', 'Search Task Templates', 'Search User Groups', 'Search Users', 'Search Workflow Policies', 'Search Workflow Roles', 'Create Workflow', 'Search Workflows', 'Search Workflow Types');
DELETE FROM QuickLinkExecutionParameter
DELETE FROM QuickLinkExecution

-- UdfItem
DELETE FROM [UdfItem]
DELETE FROM [UdfItemTreeStructure]
--Tag & TagScheme
DELETE FROM [Tag]
DELETE FROM [TagScheme]

-- Reset WS Limits MAX Batch Count
declare @Date date = GETDATE()
exec [dbo].[BatchCountUpdate_sp] 10000, @Date
UPDATE CountOfProcessedBatches SET	CurrentCount = 0