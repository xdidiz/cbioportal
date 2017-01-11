/*
 * Copyright (c) 2016 The Hyve B.V.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * @author Sander Tan
*/

package org.mskcc.cbio.portal.dao;

import org.cbioportal.model.GeneSetHierarchyLeaf;
import java.sql.*;
import java.util.*;

public class DaoGeneSetHierarchyLeaf {

	// Keep Constructor empty
	private DaoGeneSetHierarchyLeaf() {
	}
    
	/**
     * Add gene set hierarchy object to geneset_hierarchy table in database.
     * @throws DaoException 
     */	
	public static void addGeneSetHierarchyLeaf(GeneSetHierarchyLeaf geneSetHierarchyLeaf) throws DaoException {
        Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchyLeaf.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("INSERT INTO geneset_hierarchy_leaf " 
	                + "(`NODE_ID`, `GENESET_ID`) VALUES(?,?)");
	        
            // Fill in statement
            preparedStatement.setInt(1, geneSetHierarchyLeaf.getNodeId());
            preparedStatement.setInt(2, geneSetHierarchyLeaf.getGeneSetId());
            
            // Execute statement
            preparedStatement.executeUpdate();
            
        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchyLeaf.class, connection, preparedStatement, resultSet);
        }
	}

	
    /**
     * Retrieve gene set hierarchy leaf objects from geneset_hierarchy_leaf table in database.
     * @throws DaoException 
     */
	public static List<GeneSetHierarchyLeaf> getGeneSetHierarchyLeafsByNodeId(int nodeId) throws DaoException {
		Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchyLeaf.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("SELECT * FROM geneset_hierarchy_lef WHERE NODE_ID = ?");
            preparedStatement.setInt(1, nodeId);

            // Execute statement
            resultSet = preparedStatement.executeQuery();
            
            List<GeneSetHierarchyLeaf> geneSetHierarchyLeafs = new ArrayList<GeneSetHierarchyLeaf>();

            while (resultSet.next()) {
                GeneSetHierarchyLeaf geneSetHierarchyLeaf = new GeneSetHierarchyLeaf();
            	geneSetHierarchyLeaf.setNodeId(resultSet.getInt("NODE_ID"));
                geneSetHierarchyLeaf.setGeneSetId(resultSet.getInt("GENESET_ID"));
                geneSetHierarchyLeafs.add(geneSetHierarchyLeaf);
            }
            
            return geneSetHierarchyLeafs;

        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchyLeaf.class, connection, preparedStatement, resultSet);
        }
	}
	
	public static List<GeneSetHierarchyLeaf> getGeneSetHierarchyLeafsByGeneSetId(int geneSetId) throws DaoException {
		Connection connection = null;
        PreparedStatement preparedStatement = null;
        ResultSet resultSet = null;
        
        try {
        	// Open connection to database
            connection = JdbcUtil.getDbConnection(DaoGeneSetHierarchyLeaf.class);
	        
	        // Prepare SQL statement
            preparedStatement = connection.prepareStatement("SELECT * FROM geneset_hierarchy_leaf WHERE GENESET_ID = ?");
            preparedStatement.setInt(1, geneSetId);

            // Execute statement
            resultSet = preparedStatement.executeQuery();
            
            List<GeneSetHierarchyLeaf> geneSetHierarchyLeafs = new ArrayList<GeneSetHierarchyLeaf>();

            while (resultSet.next()) {
                GeneSetHierarchyLeaf geneSetHierarchyLeaf = new GeneSetHierarchyLeaf();
            	geneSetHierarchyLeaf.setNodeId(resultSet.getInt("NODE_ID"));
                geneSetHierarchyLeaf.setGeneSetId(resultSet.getInt("GENESET_ID"));
                geneSetHierarchyLeafs.add(geneSetHierarchyLeaf);
            }
            
            return geneSetHierarchyLeafs;

        } catch (SQLException e) {
            throw new DaoException(e);
        } finally {
            JdbcUtil.closeAll(DaoGeneSetHierarchyLeaf.class, connection, preparedStatement, resultSet);
        }
	}
}
