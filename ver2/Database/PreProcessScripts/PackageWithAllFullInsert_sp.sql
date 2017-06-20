CREATE PROCEDURE PackageWithAllFullInsert_sp
	@ID uniqueidentifier,
	@Name varchar(255),
	@Description nvarchar(2000),
	@IsLocked bit,
	@CreatedSetter datetime = null,
	@CreatedBy_ID uniqueidentifier,
	@ContentSecurityPolicy_PackageID uniqueidentifier = null,
	@ContentSecurityPolicy_DefaultSrc nvarchar(2000) = null,
	@ContentSecurityPolicy_ScriptSrc nvarchar(2000) = null,
	@ContentSecurityPolicy_ObjectSrc nvarchar(2000) = null,
	@ContentSecurityPolicy_StyleSrc nvarchar(2000) = null,
	@ContentSecurityPolicy_ImgSrc nvarchar(2000) = null,
	@ContentSecurityPolicy_MediaSrc nvarchar(2000) = null,
	@ContentSecurityPolicy_FrameSrc nvarchar(2000) = null,
	@ContentSecurityPolicy_FontSrc nvarchar(2000) = null,
	@ContentSecurityPolicy_ConnectSrc nvarchar(2000) = null,
	@ContentSecurityPolicy_Sandbox nvarchar(2000) = null,
	@IsRoutingEnabled bit
AS
	SET NOCOUNT ON

	EXEC PackageWithAllInsert_sp
		@ID = @ID,
		@Name = @Name,
		@Description = @Description,
		@IsLocked = @IsLocked,
		@CreatedBy_ID = @CreatedBy_ID,
		@ContentSecurityPolicy_PackageID = @ContentSecurityPolicy_PackageID,
		@ContentSecurityPolicy_DefaultSrc = @ContentSecurityPolicy_DefaultSrc,
		@ContentSecurityPolicy_ScriptSrc = @ContentSecurityPolicy_ScriptSrc,
		@ContentSecurityPolicy_ObjectSrc = @ContentSecurityPolicy_ObjectSrc,
		@ContentSecurityPolicy_StyleSrc = @ContentSecurityPolicy_StyleSrc,
		@ContentSecurityPolicy_ImgSrc = @ContentSecurityPolicy_ImgSrc,
		@ContentSecurityPolicy_MediaSrc = @ContentSecurityPolicy_MediaSrc,
		@ContentSecurityPolicy_FrameSrc = @ContentSecurityPolicy_FrameSrc,
		@ContentSecurityPolicy_FontSrc = @ContentSecurityPolicy_FontSrc,
		@ContentSecurityPolicy_ConnectSrc = @ContentSecurityPolicy_ConnectSrc,
		@ContentSecurityPolicy_Sandbox = @ContentSecurityPolicy_Sandbox,
		@IsRoutingEnabled = @IsRoutingEnabled

	UPDATE Package SET 
		Created = ISNULL(@CreatedSetter, GetUTCDate())
	WHERE ID = @ID