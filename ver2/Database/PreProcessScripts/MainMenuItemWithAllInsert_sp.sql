CREATE PROCEDURE MainMenuItemWithAllInsert_sp
	@ID uniqueidentifier,
	@Name varchar(255),
	@Description nvarchar(2000),
	@PositionIndex tinyint,
	@StaticMenuItemCode varchar(100),
	@PackageID uniqueidentifier,
	@VisibleToAll bit,
	@InvisibleToAll bit
AS
	SET NOCOUNT ON

	INSERT INTO MainMenuItem(ID, [Name], Description, Created, PositionIndex, StaticMenuItemCode, PackageID, VisibleToAll, InvisibleToAll)
	VALUES(@ID, @Name, @Description, GetUTCDate(), @PositionIndex, @StaticMenuItemCode, @PackageID, @VisibleToAll, @InvisibleToAll)
	
	INSERT INTO MainMenuItemUserVisibility(MainMenuItemID, UserID, Visible)
	SELECT u.ID, u.ParentID, u.Visible
	FROM #Users u
	
	INSERT INTO MainMenuItemGroupVisibility(MainMenuItemID, GroupID, Visible)
	SELECT g.ID, g.ParentID, g.Visible
	FROM #Groups g