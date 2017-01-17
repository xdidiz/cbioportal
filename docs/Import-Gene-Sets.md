# Gene set data in cBioPortal

Gene sets are collections of genes that can be part of specific molecular process or are co-regulated. This might be useful in case the user wants to visualize the number of mutations in sets of genes, or wants to see if the geneset is up- or down-regulated in a sample. To assess this last part, the user can calculate scores per geneset per sample using the GSVA algorithm (Hänzelmann, 2013). 

Before loading a study with gene set data such as GSVA Scores, gene sets have to be added to the database. It is also possible to import a gene set hierachy, which can be used to select gene sets on the query page. This document will explain:
0. Requirements for gene sets in cBioPortal
1. Importing gene sets (.gmt format)
3. Importing gene set hierarchy

**References**<br>
Sonja Hänzelmann, Robert Castelo and Justin Guinney<br>
*GSVA: gene set variation analysis for microarray and RNA-Seq data*<br>
BMC Bioinformatics, 2013
http://bmcbioinformatics.biomedcentral.com/articles/10.1186/1471-2105-14-7
http://www.bioconductor.org/packages/release/bioc/html/GSVA.html

### Requirements for Gene Sets
Gene set functionality was added in cBioPortal x.x.x. Therefor please use this or a later version. In addition, because gene sets are stored in tables specific for gene sets, the database schema has to be updated to at least version 2.1.0. This can be done with the by running *migration.sql* or the python wrapper *migrate_db.py* in /Users/sander/Data/cbioportal/core/src/main/scripts/migrate_db.py. This is described in https://github.com/cBioPortal/cbioportal/blob/master/docs/Updating-your-cBioPortal-installation.md#running-the-migration-script.

## Import Gene Sets

### File formats
Once you have initialized MySQL with the seed database, it is possible to import gene sets. The format of the gene set data file is the Gene Matrix Transposed file format (.gmt, http://software.broadinstitute.org/cancer/software/gsea/wiki/index.php/Data_formats#GMT:_Gene_Matrix_Transposed_file_format_.28.2A.gmt.29). This format is also used by the MSigDB, which hosts several collections of gene sets (http://software.broadinstitute.org/gsea/msigdb/).

Sample of .gmt file:
```
GLI1_UP.V1_DN	http://...	22818	143384
GLI1_UP.V1_UP	http://...	3489	3119
E2F1_UP.V1_DN	http://...	7041	6374	5460	
```

GMT files contain a row for every gene set. The first column contains the EXTERNAL_ID or `stable id` (MsigDB calls this "standard name"), e.g. GO_POTASSIUM_ION_TRANSPORT, not longer than 100 characters. The second column contains the REF_LINK, an optional URL linking to external information about this gene set, e.g. Column 3 to N contain the Entrez gene ids that belong to this gene set.

Additional information can be loaded in a supplementary file. This file should be a .txt, containing columns for the `stable id`, the full name (max 100 characters) and description of the gene set (max 300 characters). 

Sample of suppelemtary .txt file:
```
GLI1_UP.V1_DN	GLI1 upregulated v1 down	Genes down-regulated in RK3E cells (kidney epithelium) over-expressing GLI1 [GeneID=2735].
GLI1_UP.V1_UP	GLI1 upregulated v1 up genes	Genes up-regulated in RK3E cells (kidney epithelium) over-expressing GLI1 [GeneID=2735].
E2F1_UP.V1_DN	E2F1_UP.V1_DN	Identification of E2F1-regulated genes that modulate the transition from quiescence into DNA synthesis, or have roles in apoptosis, signal transduction, membrane biology, and transcription repression.

```
### Run the importer
The importer for gene sets is located at the following location and has the following arguments:
```
$PORTAL_HOME/core/src/main/java/org/mskcc/cbio/portal/scripts/ImportGeneSetData.java

required:     --data <data_file.gmt>  
              --new-version <Version> OR --update-info
optional:     --supp <supp_file.txt>
```
When importing gene sets, it is required to add the argument `--new-version` with a user defined version. Later when the user imports genomic profiles with gene set data, it is also required to give this version in the meta files. This ensures that the data is generated with the same version of genesets that is in the database. 

When the user has new gene sets he would like to add, or update the genes of the current genesets, the user has to use the `--new-version` argument. Note that it is possible to keep the version number the same. Running the script with `--new-version` does **remove** all previous gene sets, gene set hierarchy and gene set score genetic profiles. A prompt is given to make sure the user wants to do this.

The option `--update info` can only be used to update the gene set name, description or reference link.

## Import Gene Set hierarchy

When genesets are imported, the user can import a geneset hierarchy that is used on the query page to select gene sets.

### File formats
For gene set hierarchy files, we use the YAML format. This is common format to sturcture hierarchical data. 

Sample of format (note this is mock data):

```
Custom:
  Gene sets:
    - BCAT.100_UP.V1_DN
Cancer Gene sets from Broad:
  Gene sets:
    - AKT_UP.V1_DN
    - CYCLIN_D1_KE_.V1_UP
  Broad Subcategory 1:
    Gene sets:
      - HINATA_NFKB_MATRIX
  Broad Subcategory 2:
    Gene sets:
      - GLI1_UP.V1_UP
      - GLI1_UP.V1_DN
      - CYCLIN_D1_KE_.V1_UP

```

To make your own hierarchy, make sure every branchname ends with `:`. Every branch can contain new branches (which can be considered subcategories) or gene sets (which are designated by the `Gene sets:` statement). The gene set names are the `stable ids` imported by `ImportGeneSetData.java`.

### Running the importer
```
$PORTAL_HOME/core/src/main/java/org/mskcc/cbio/portal/scripts/ImportGeneSetHierarchy.java

required:     --data <data_file.yaml>  
```

## Import Gene Set data

Gene set data can be added to a study folder, when the whole study is imported by metaImport.py. cBioPortal supports GSVA Scores and GSVA Pvalues (from bootstrapping) calculated by the GSVA algorithm in R. For the GSVA gene set scores we will need 2 sets of a meta and a data file, according to the cBioPortal data loading specifications for study data. One set for the GSVA scores per sample, and one for the respective GSVA p-values of these scores per sample.

Meta file1: for the scores
The meta file will be similar to meta files of other genetic profiles, such as mRNA expression. These are the required fields: 

```
cancer_study_identifier: same value as specified in study meta file
genetic_alteration_type: GENESET_SCOREGSVA-SCORES
datatype: GSVA-SCORECONTINUOUS
stable_id: any unique identifier within the study
source_stable_id: stable id of the genetic profile (in this same study) that was used as the input source for calculating the GSVA scores. Typically this will be one of the mRNA expression genetic profiles. 
profile_name: A name describing the analysis, e.g., "GSVA scores on oncogenic signatures gene sets".
profile_description: A description of the data processing done, e.g., "GSVA scores on oncogenic signatures gene sets using mRNA expression data".
data_filename: <your datafile>
geneset_def_version: version of the gene sets definition this calculation was based on. 
```

Example:
```
cancer_study_identifier: study_es_0
genetic_alteration_type: GENESET_SCORE
datatype: GSVA-SCORE
stable_id: gsva_oncogenic_sets_scores
source_stable_id: rna_seq_v2_mrna
profile_name: GSVA scores on oncogenic signatures gene sets
profile_description: GSVA scores using mRNA expression data
data_filename: data_gsva_scores.txt
geneset_def_version: 1
```

Data file 1: for the scores
The data file will be a simple tab separated format, similar to the expression data  file: each sample is a column, each gene set a row, each cell represents the GSVA score for that sample x gene set combination.

These are the columns:
GENESET_ID: EXTERNAL_ID or "stable id" (MsigDB calls this "standard name") of the gene set
SAMPLE_1 up to SAMPLE_N: An additional column for each sample in the dataset using the sample id as the column header.
The cells contain the GSVA score:
A real number, between -1.0 and 1.0, representing the GSVA score for the gene set in the respective sample, or  NA for when the GSVA score for the gene set in the respective sample could not be (or was not) calculated.
P_VALUE: A real number, between 0.0 and 1.0, representing the p-value for the GSVA score given in the VALUE column above, or  NA for when the GSVA score for the gene is also NA.
Example with 2 gene sets and 3 samples: 

| GENESET_ID                      | TCGA-AO-A0J | TCGA-A2-A0Y | TCGA-A2-A0S |
|---------------------------------|-------------|-------------|-------------|
| GO_POTASSIUM_ION_TRANSPOR       | -0.987      | 0.423       | -0.879      |
| GO_GLUCURONATE_METABOLIC_PROCES | 0.546       | 0.654       | 0.123       |
| ..                              |             |             |             |





Meta file 2: for the p-values
The meta file will be similar to meta files of other genetic profiles, such as mRNA expression. These are the fields: 
```
cancer_study_identifier: same value as specified in study meta file
genetic_alteration_type: GENESET_SCOREGSVA
datatype: P-VALUECONTINUOUS
stable_id: any unique identifier within the study
source_stable_id: stable id of the GSVA-SCORES genetic profile (see above). 
profile_name: A name describing the analysis, e.g., "p-values for GSVA scores on oncogenic signatures gene sets".
profile_description: A description of the data processing done, e.g., "p-values for  GSVA scores on oncogenic signatures gene sets using mRNA expression data".
data_filename: <your datafile>
geneset_def_version: version of the gene sets definition this calculation was based on. 
```
Example:
```
cancer_study_identifier: study_es_0
genetic_alteration_type: GENESET_SCOREGSVA-P-VALUES
datatype: P-VALUE
stable_id: gsva_oncogenic_sets_pvalues
source_stable_id: gsva_oncogenic_sets_scores
profile_name: p-values for GSVA scores on oncogenic signatures gene sets
profile_description: p-values for GSVA scores using mRNA expression data
data_filename: data_gsva_pvalues.txt
geneset_def_version: 1
```

Data file 2: for the p-values
The data file will be a simple tab separated format, similar to the expression data  file: each sample is a column, each gene set a row, each cell represents the GSVA p-value for the score found for that sample x gene set combination.

These are the columns::
GENESET_ID: EXTERNAL_ID or "stable id" (MsigDB calls this "standard name") of the gene set
SAMPLE_ID_1 up to SAMPLE_ID_N: An additional column for each sample in the dataset using the sample id as the column header.
The cells contain the p-value for the GSVA score:
A real number, between 0.0 and 1.0, representing the p-value for the GSVA score calculated for the gene set in the respective sample, or  NA for when the GSVA score for the gene is also NA.
Example with 2 gene sets and 3 samples: 

| GENESET_ID                      | TCGA-AO-A0J | TCGA-A2-A0Y | TCGA-A2-A0S |
|---------------------------------|-------------|-------------|-------------|
| GO_POTASSIUM_ION_TRANSPOR       | 0.0811      | 0.0431      | 0.0087      |
| GO_GLUCURONATE_METABOLIC_PROCES | 0.6621      | 0.0031      | 1.52e-9     |
| ..                              |             |             |             |
